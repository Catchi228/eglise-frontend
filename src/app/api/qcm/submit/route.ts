import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { execute } from "@/lib/db";
import { scoreQcmAnswers } from "@/lib/server/qcm";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();

    let payload: { qcmId?: unknown; answers?: unknown };
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "JSON invalide" }, { status: 400 });
    }

    const qcmId = typeof payload.qcmId === "string" ? payload.qcmId : "";
    const answers = Array.isArray(payload.answers)
      ? payload.answers.map((a) => Number(a))
      : [];

    if (!qcmId || answers.length === 0) {
      return Response.json({ error: "qcmId et answers requis" }, { status: 400 });
    }

    const { score, total, correctIndices } = await scoreQcmAnswers(qcmId, answers);
    if (total === 0) {
      return Response.json({ error: "QCM invalide" }, { status: 400 });
    }

    await execute(
      "INSERT INTO qcm_attempts (user_id, qcm_id, score, total) VALUES (?, ?, ?, ?)",
      [user.id, qcmId, score, total],
    );

    return Response.json({
      score,
      total,
      percent: Math.round((score / total) * 100),
      correctIndices,
    });
  } catch (e) {
    const sec = securityErrorResponse(e);
    if (sec) return sec;
    const auth = authErrorResponse(e);
    if (auth) return auth;
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
