import { getCurrentUser } from "@/lib/auth";
import { isCourseAccessible } from "@/lib/courseAccess";
import { fetchAnnouncementsFromDb, fetchCoursesFromDb } from "@/lib/server/siteContent";

/** Données portail : annonces publiques ; cours accessibles sans connexion (ex. Ecodim). */
export async function GET() {
  const user = await getCurrentUser();
  const announcements = (await fetchAnnouncementsFromDb()).filter(
    (a) => a.status === "Publiée",
  );
  const allCourses = await fetchCoursesFromDb();
  const courses = user ? allCourses : allCourses.filter((c) => isCourseAccessible(c));

  return Response.json(
    { announcements, courses },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
