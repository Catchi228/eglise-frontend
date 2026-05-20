import { getCurrentUser } from "@/lib/auth";
import { fetchAnnouncementsFromDb, fetchCoursesFromDb } from "@/lib/server/siteContent";

/** Données portail : annonces publiques ; cours uniquement si session valide. */
export async function GET() {
  const user = await getCurrentUser();
  const announcements = await fetchAnnouncementsFromDb();
  const courses = user ? await fetchCoursesFromDb() : [];

  return Response.json(
    { announcements, courses },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
