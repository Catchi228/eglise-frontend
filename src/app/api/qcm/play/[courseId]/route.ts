import { authErrorResponse, requireUser } from "@/lib/auth";
import { fetchQcmForCourse } from "@/lib/server/qcm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const { courseId } = await ctx.params;
  const qcm = await fetchQcmForCourse(courseId);
  if (!qcm || qcm.questions.length === 0) {
    return Response.json({ error: "Aucun QCM disponible pour ce cours" }, { status: 404 });
  }

  return Response.json({
    qcm: {
      id: qcm.id,
      courseId: qcm.courseId,
      title: qcm.title,
      questions: qcm.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        choices: q.choices,
      })),
    },
  });
}
