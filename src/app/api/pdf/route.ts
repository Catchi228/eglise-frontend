import { readFile } from "node:fs/promises";
import path from "node:path";
import { authErrorResponse, requireUser } from "@/lib/auth";

/**
 * GET /api/pdf?src=/uploads/courses/file.pdf
 * Sert un fichier PDF depuis public/ avec X-Frame-Options: SAMEORIGIN
 * afin qu'il puisse être embarqué dans un <iframe> same-origin.
 */
export async function GET(req: Request) {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? new Response("Non autorisé", { status: 401 });
  }

  const src = new URL(req.url).searchParams.get("src") ?? "";

  // Sécurité : uniquement les fichiers dans /uploads/, pas de path traversal
  if (!src.startsWith("/uploads/") || src.includes("..")) {
    return new Response("Chemin non autorisé", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", src);

  try {
    const data = await readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": "application/pdf",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Fichier introuvable", { status: 404 });
  }
}
