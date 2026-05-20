import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export type UploadSubdir = "logo" | "announcements" | "courses";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const MAGIC: Array<{ mime: string; ext: string; sig: number[]; offset?: number }> = [
  { mime: "image/jpeg", ext: ".jpg", sig: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: ".png", sig: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", ext: ".gif", sig: [0x47, 0x49, 0x46] },
  { mime: "image/webp", ext: ".webp", sig: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: "application/pdf", ext: ".pdf", sig: [0x25, 0x50, 0x44, 0x46] },
];

function matchMagic(buf: Buffer): { mime: string; ext: string } | null {
  for (const m of MAGIC) {
    const off = m.offset ?? 0;
    if (buf.length < off + m.sig.length) continue;
    if (m.sig.every((b, i) => buf[off + i] === b)) {
      return { mime: m.mime, ext: m.ext };
    }
  }
  return null;
}

function pickExtension(file: File, buf: Buffer): string {
  const magic = matchMagic(buf);
  if (magic) return magic.ext;
  const fromMime = EXT_BY_MIME[file.type];
  if (fromMime && fromMime !== ".svg") return fromMime;
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  if (dot >= 0 && dot < name.length - 1) {
    const ext = name.slice(dot).toLowerCase();
    if (ext !== ".svg") return ext;
  }
  return "";
}

export async function saveUpload(file: File, subdir: UploadSubdir): Promise<string> {
  if (!(file instanceof File) || !file.size) {
    throw new Error("Fichier invalide");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const magic = matchMagic(buf);
  if (!magic) {
    throw new Error("Type de fichier non reconnu ou non autorisé");
  }
  if (subdir !== "courses" && magic.mime === "application/pdf") {
    throw new Error("PDF non autorisé pour ce dossier");
  }
  if (subdir === "courses" && magic.mime !== "application/pdf") {
    throw new Error("Seuls les PDF sont autorisés pour les cours");
  }
  if (magic.mime !== "application/pdf" && file.type === "image/svg+xml") {
    throw new Error("SVG non autorisé");
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const ext = pickExtension(file, buf) || magic.ext;
  const id = randomBytes(16).toString("hex");
  const filename = `${id}${ext}`;
  const abs = path.join(dir, filename);

  await writeFile(abs, buf);

  return `/uploads/${subdir}/${filename}`;
}

export async function deleteUpload(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const rel = publicPath.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  if (!abs.startsWith(UPLOAD_ROOT)) return;
  try {
    await unlink(abs);
  } catch {
    // fichier déjà manquant
  }
}

export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
