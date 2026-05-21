import { authErrorResponse, requireUser } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";
import {
  buildCoursePdfBuffer,
  pdfFilenameFromTitle,
} from "@/lib/server/generateCoursePdf";
import type { CourseStatus, LessonSection } from "@/lib/types";
import { isCourseAccessible } from "@/lib/courseAccess";

export const runtime = "nodejs";

type CourseRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  content: string | null;
  status: string;
  start_at: string;
  end_at: string;
  time: string;
};

function parseContent(raw: string | null): LessonSection[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter(
      (s): s is LessonSection =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as LessonSection).heading === "string" &&
        typeof (s as LessonSection).body === "string",
    );
  } catch {
    return undefined;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? new Response("Non autorisé", { status: 401 });
  }

  const { courseId } = await ctx.params;
  const rows = await query<CourseRow[]>(
    `SELECT id, title, description, content, status, start_at, end_at, time
     FROM courses WHERE id = ? LIMIT 1`,
    [courseId],
  );
  const course = rows[0];
  if (!course) return new Response("Cours introuvable", { status: 404 });
  if (!isCourseAccessible({ id: course.id, status: course.status as CourseStatus })) {
    return new Response("Leçon non disponible", { status: 403 });
  }

  const buffer = await buildCoursePdfBuffer({
    title: course.title,
    description: course.description,
    startAt: course.start_at,
    endAt: course.end_at,
    time: course.time,
    sections: parseContent(course.content),
  });

  const filename = pdfFilenameFromTitle(course.title);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
