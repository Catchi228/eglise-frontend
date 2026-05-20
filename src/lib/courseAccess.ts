import type { Course } from "@/lib/types";

/** Cours consultables (pas « À venir »). */
export function isCourseAccessible(course: Course | null | undefined): boolean {
  return Boolean(course && course.status !== "À venir");
}

/** PDF généré uniquement pour la leçon ouverte (contenu en base de cette leçon). */
export function lessonPdfDownload(course: Pick<Course, "id" | "title">): {
  url: string;
  name: string;
} {
  const safe = course.title.replace(/[/\\?%*:|"<>]/g, "-").trim() || "lecon";
  return {
    url: `/api/courses/${course.id}/pdf`,
    name: `${safe}.pdf`,
  };
}

/** Tri des leçons Ecodim (ecodim-2026-l01 … l10) par numéro. */
export function compareCoursesForDisplay(a: Course, b: Course): number {
  const na = /^ecodim-2026-l(\d+)$/.exec(a.id)?.[1];
  const nb = /^ecodim-2026-l(\d+)$/.exec(b.id)?.[1];
  if (na && nb) return Number(na) - Number(nb);
  if (na) return -1;
  if (nb) return 1;
  return a.title.localeCompare(b.title, "fr");
}
