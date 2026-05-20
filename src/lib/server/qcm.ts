import "server-only";

import { query, type RowDataPacket } from "@/lib/db";
import type { QcmPlay, QcmQuestion } from "@/lib/types";

type QcmRow = RowDataPacket & {
  id: string;
  course_id: string;
  title: string;
};

type QuestionRow = RowDataPacket & {
  id: number;
  qcm_id: string;
  prompt: string;
  choices: string | unknown;
  correct_index: number;
  position: number;
};

function parseChoices(raw: string | unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchQcmForCourse(courseId: string): Promise<QcmPlay | null> {
  const qcms = await query<QcmRow[]>(
    "SELECT id, course_id, title FROM qcm WHERE course_id = ? ORDER BY updated_at DESC LIMIT 1",
    [courseId],
  );
  const qcm = qcms[0];
  if (!qcm) return null;

  const rows = await query<QuestionRow[]>(
    `SELECT id, qcm_id, prompt, choices, correct_index, position
       FROM qcm_questions WHERE qcm_id = ? ORDER BY position`,
    [qcm.id],
  );

  const questions: QcmQuestion[] = rows.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    choices: parseChoices(r.choices),
  }));

  return {
    id: qcm.id,
    courseId: qcm.course_id,
    title: qcm.title,
    questions,
  };
}

export async function scoreQcmAnswers(
  qcmId: string,
  answers: number[],
): Promise<{ score: number; total: number; correctIndices: number[] }> {
  const rows = await query<QuestionRow[]>(
    `SELECT correct_index, position FROM qcm_questions WHERE qcm_id = ? ORDER BY position`,
    [qcmId],
  );
  const correctIndices = rows.map((r) => r.correct_index);
  let score = 0;
  for (let i = 0; i < rows.length; i++) {
    if (answers[i] === correctIndices[i]) score++;
  }
  return { score, total: rows.length, correctIndices };
}
