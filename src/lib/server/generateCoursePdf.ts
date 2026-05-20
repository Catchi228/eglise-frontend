import "server-only";

import PDFDocument from "pdfkit";
import type { LessonSection } from "@/lib/types";

export type CoursePdfInput = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  time?: string;
  sections?: LessonSection[];
};

function writeParagraph(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  opts?: { fontSize?: number; bold?: boolean },
) {
  const fontSize = opts?.fontSize ?? 11;
  doc.fontSize(fontSize).font(opts?.bold ? "Helvetica-Bold" : "Helvetica");
  doc.text(text.replace(/\r\n/g, "\n"), {
    align: "left",
    lineGap: 4,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
  });
}

/** Génère un PDF à partir du contenu structuré d'une leçon. */
export function buildCoursePdfBuffer(input: CoursePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: input.title,
        Author: "Convention Baptiste du Togo — Ecodim",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeParagraph(doc, input.title, { fontSize: 20, bold: true });
    doc.moveDown(0.5);
    writeParagraph(doc, input.description, { fontSize: 12 });
    doc.moveDown(0.3);
    writeParagraph(
      doc,
      `Période : ${input.startAt} → ${input.endAt}${input.time ? ` · ${input.time}` : ""}`,
      { fontSize: 10 },
    );
    doc.moveDown(1);

    const sections = input.sections ?? [];
    if (sections.length === 0) {
      writeParagraph(doc, "Contenu de la leçon disponible sur le site.", { fontSize: 11 });
    } else {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        if (i > 0) doc.moveDown(0.6);
        writeParagraph(doc, s.heading, { fontSize: 14, bold: true });
        doc.moveDown(0.25);
        writeParagraph(doc, s.body, { fontSize: 11 });
      }
    }

    doc.moveDown(1.5);
    writeParagraph(
      doc,
      "Document généré automatiquement depuis le portail Ecodim CBT — Convention Baptiste du Togo.",
      { fontSize: 8 },
    );

    doc.end();
  });
}

export function pdfFilenameFromTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "lecon"}.pdf`;
}
