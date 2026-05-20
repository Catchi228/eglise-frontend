import "server-only";

import { query, type RowDataPacket } from "@/lib/db";
import type {
  Announcement,
  AnnouncementCategory,
  Course,
  CoursePdfFile,
  CourseStatus,
  LessonSection,
} from "@/lib/types";

type AnnouncementRow = RowDataPacket & {
  id: string;
  category: AnnouncementCategory;
  status: "Publiée" | "Désactivée";
  title: string;
  body: string;
  city: string | null;
  start_at: string | null;
  end_at: string | null;
  contact_email: string | null;
};

type ImageRow = RowDataPacket & {
  announcement_id: string;
  path: string;
  position: number;
};

export async function fetchAnnouncementsFromDb(): Promise<Announcement[]> {
  const rows = await query<AnnouncementRow[]>(
    "SELECT id, category, status, title, body, city, start_at, end_at, contact_email FROM announcements ORDER BY created_at DESC",
  );
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const images = await query<ImageRow[]>(
    `SELECT announcement_id, path, position FROM announcement_images
      WHERE announcement_id IN (${placeholders})
      ORDER BY announcement_id, position`,
    ids,
  );
  const byAnnouncement = new Map<string, string[]>();
  for (const img of images) {
    const arr = byAnnouncement.get(img.announcement_id) ?? [];
    arr.push(img.path);
    byAnnouncement.set(img.announcement_id, arr);
  }

  return rows.map((r): Announcement => ({
    id: r.id,
    category: r.category,
    status: r.status,
    title: r.title,
    body: r.body,
    city: r.city ?? undefined,
    startAt: r.start_at ?? undefined,
    endAt: r.end_at ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    imageUrls: byAnnouncement.get(r.id) ?? [],
  }));
}

type CourseRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  content: string | null;
  status: CourseStatus;
  start_at: string;
  end_at: string;
  time: string;
};

type SectionRow = RowDataPacket & {
  id: string;
  course_id: string;
  title: string;
  duration_min: number;
  position: number;
};

type TagRow = RowDataPacket & { course_id: string; tag: string };

type PdfRow = RowDataPacket & {
  id: string;
  course_id: string;
  name: string;
  path: string;
};

function parseContent(raw: string | null): LessonSection[] | undefined {
  if (!raw) return undefined;
  try { return JSON.parse(raw) as LessonSection[]; } catch { return undefined; }
}

export async function fetchCoursesFromDb(): Promise<Course[]> {
  const courses = await query<CourseRow[]>(
    "SELECT id, title, description, content, status, start_at, end_at, time FROM courses ORDER BY created_at DESC",
  );
  if (courses.length === 0) return [];

  const ids = courses.map((c) => c.id);
  const placeholders = ids.map(() => "?").join(",");

  const [tags, sections, pdfs] = await Promise.all([
    query<TagRow[]>(`SELECT course_id, tag FROM course_tags WHERE course_id IN (${placeholders})`, ids),
    query<SectionRow[]>(
      `SELECT id, course_id, title, duration_min, position FROM course_sections WHERE course_id IN (${placeholders}) ORDER BY course_id, position`,
      ids,
    ),
    query<PdfRow[]>(
      `SELECT id, course_id, name, path FROM course_pdfs WHERE course_id IN (${placeholders}) ORDER BY created_at`,
      ids,
    ),
  ]);

  const tagsBy = new Map<string, string[]>();
  for (const t of tags) {
    const a = tagsBy.get(t.course_id) ?? [];
    a.push(t.tag);
    tagsBy.set(t.course_id, a);
  }

  const sectionsBy = new Map<string, Course["sections"]>();
  for (const s of sections) {
    const a = sectionsBy.get(s.course_id) ?? [];
    a.push({ id: s.id, title: s.title, durationMin: s.duration_min });
    sectionsBy.set(s.course_id, a);
  }

  const pdfsBy = new Map<string, CoursePdfFile[]>();
  for (const p of pdfs) {
    const a = pdfsBy.get(p.course_id) ?? [];
    a.push({ id: p.id, name: p.name, dataUrl: p.path });
    pdfsBy.set(p.course_id, a);
  }

  return courses.map((c): Course => ({
    id: c.id,
    title: c.title,
    description: c.description,
    content: parseContent(c.content),
    status: c.status,
    startAt: c.start_at,
    endAt: c.end_at,
    time: c.time,
    tags: tagsBy.get(c.id) ?? [],
    sections: sectionsBy.get(c.id) ?? [],
    pdfFiles: pdfsBy.get(c.id),
  }));
}
