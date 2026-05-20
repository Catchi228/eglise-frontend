import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

type CourseRow = RowDataPacket & { id: string; title: string; description: string };
type PdfRow    = RowDataPacket & { name: string; path: string };

const DIFFICULTIES = ["Facile", "Moyen", "Difficile"] as const;
type Difficulty = typeof DIFFICULTIES[number];

type GeneratedQ = { prompt: string; choices: string[]; correctIndex: number };

/**
 * Génère des questions à partir de la description du cours.
 * Si OPENAI_API_KEY est défini, utilise GPT-4o-mini.
 * Sinon, génère des questions génériques de bonne qualité.
 */
async function generateQuestions(
  title: string,
  description: string,
  count: number,
  difficulty: Difficulty,
): Promise<GeneratedQ[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return generateWithOpenAI(apiKey, title, description, count, difficulty);
  }
  return generateFallback(title, description, count, difficulty);
}

async function generateWithOpenAI(
  apiKey: string,
  title: string,
  description: string,
  count: number,
  difficulty: Difficulty,
): Promise<GeneratedQ[]> {
  const systemPrompt = `Tu es un professeur d'école du dimanche chrétien francophone. 
Tu génères des QCM pour évaluer la compréhension d'une leçon.
Réponds UNIQUEMENT avec un tableau JSON valide de questions.
Format exact : [{"prompt":"question","choices":["A","B","C","D"],"correctIndex":0}]
- ${count} questions niveau ${difficulty}
- Les choix doivent être plausibles, 4 choix par question.
- correctIndex est l'index (0-3) de la bonne réponse dans le tableau choices.`;

  const userPrompt = `Leçon : « ${title} »\nContenu : ${description}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices[0]?.message?.content ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Réponse OpenAI invalide");
  return JSON.parse(jsonMatch[0]) as GeneratedQ[];
}

function generateFallback(
  title: string,
  description: string,
  count: number,
  _difficulty: Difficulty,
): GeneratedQ[] {
  const templates: GeneratedQ[] = [
    {
      prompt: `Quel est le thème principal de la leçon « ${title} » ?`,
      choices: [
        description.split(".")[0]?.trim().slice(0, 60) || title,
        "La liturgie des premiers chrétiens",
        "Les miracles de l'Ancien Testament",
        "L'histoire de la réforme protestante",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Dans le cadre du programme Ecodim 2026, que signifie le mot-clé de cette leçon ?`,
      choices: [
        "Une connaissance approfondie par l'étude et la prière",
        "Une cérémonie rituelle hebdomadaire",
        "Un document officiel de l'Église",
        "Un titre honorifique",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Comment la leçon « ${title} » s'applique-t-elle dans la vie quotidienne du chrétien ?`,
      choices: [
        "Par la mise en pratique des Écritures dans toutes les décisions",
        "En fréquentant uniquement des activités religieuses",
        "En mémorisant les livres de l'Ancien Testament",
        "En évitant tout contact avec les non-croyants",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Quelle attitude le Seigneur attend-il des apprenants à l'issue de cette leçon ?`,
      choices: [
        "La transformation du cœur et la mise en pratique de la Parole",
        "La simple mémorisation des textes bibliques",
        "L'obtention d'un diplôme théologique",
        "La participation à des conférences internationales",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Quel verset biblique illustre le mieux l'enseignement de cette leçon ?`,
      choices: [
        "Jean 8.31-32 : « La vérité vous affranchira »",
        "Apocalypse 1.1 : « Révélation de Jésus-Christ »",
        "Actes 17.11 : « Ils examinaient les Écritures »",
        "Luc 24.1 : « Le premier jour de la semaine »",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Selon l'enseignement Ecodim 2026, quelle est l'importance de cette leçon pour la jeunesse chrétienne ?`,
      choices: [
        "Elle renforce l'identité et la foi face aux défis contemporains",
        "Elle prépare à des examens scolaires officiels",
        "Elle fournit un cadre légal pour les activités religieuses",
        "Elle remplace la lecture personnelle de la Bible",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Dans la tradition de l'école du dimanche, comment cette leçon est-elle transmise ?`,
      choices: [
        "Par l'enseignement oral, les discussions et les supports écrits",
        "Uniquement par la lecture silencieuse",
        "Par des cours universitaires en ligne",
        "Via des applications numériques exclusivement",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Quelle valeur fondamentale cette leçon cherche-t-elle à développer chez l'apprenant ?`,
      choices: [
        "La foi active, ancrée dans la Parole de Dieu",
        "La réussite professionnelle",
        "L'indépendance vis-à-vis de la communauté",
        "La connaissance de la philosophie grecque",
      ],
      correctIndex: 0,
    },
    {
      prompt: `Combien de leçons compose le programme Ecodim CBT 2026 ?`,
      choices: ["10 leçons", "5 leçons", "7 leçons", "12 leçons"],
      correctIndex: 0,
    },
    {
      prompt: `Quel est l'objectif général du programme Ecodim CBT 2026 ?`,
      choices: [
        "Édifier et former spirituellement les membres de l'Église",
        "Préparer à des concours interecclésiastiques",
        "Rédiger une thèse théologique",
        "Organiser des voyages missionnaires",
      ],
      correctIndex: 0,
    },
  ];

  const shuffled = templates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function POST(req: Request) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { qcmId?: string; courseId?: string; count?: number; difficulty?: string };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const qcmId = payload.qcmId?.trim() ?? "";
  const count = Math.min(Math.max(Number(payload.count) || 5, 1), 20);
  const difficulty = (DIFFICULTIES.includes(payload.difficulty as Difficulty)
    ? payload.difficulty : "Moyen") as Difficulty;

  if (!qcmId) return Response.json({ error: "qcmId requis" }, { status: 400 });

  // Récupère le cours associé
  const qcmRows = await query<Array<RowDataPacket & { course_id: string; title: string }>>(
    "SELECT course_id, title FROM qcm WHERE id = ?", [qcmId],
  );
  const qcmRow = qcmRows[0];
  if (!qcmRow) return Response.json({ error: "QCM introuvable" }, { status: 404 });

  const courseRows = await query<CourseRow[]>(
    "SELECT id, title, description FROM courses WHERE id = ?", [qcmRow.course_id],
  );
  const course = courseRows[0];
  if (!course) return Response.json({ error: "Cours introuvable" }, { status: 404 });

  await query<PdfRow[]>("SELECT name, path FROM course_pdfs WHERE course_id = ?", [course.id]);

  let questions: GeneratedQ[];
  try {
    questions = await generateQuestions(course.title, course.description, count, difficulty);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur de génération" },
      { status: 500 },
    );
  }

  // Récupère la position max actuelle
  const [posRow] = await query<Array<RowDataPacket & { maxPos: number | null }>>(
    "SELECT MAX(position) as maxPos FROM qcm_questions WHERE qcm_id = ?", [qcmId],
  );
  let nextPos = (posRow?.maxPos ?? -1) + 1;

  for (const q of questions) {
    const choices = Array.isArray(q.choices) ? q.choices : [];
    const correctIndex = Math.min(Math.max(Number(q.correctIndex) || 0, 0), choices.length - 1);
    await execute(
      "INSERT INTO qcm_questions (qcm_id, prompt, choices, correct_index, position) VALUES (?, ?, ?, ?, ?)",
      [qcmId, q.prompt, JSON.stringify(choices), correctIndex, nextPos++],
    );
  }

  await execute(
    "UPDATE qcm SET question_count = (SELECT COUNT(*) FROM qcm_questions WHERE qcm_id = ?), updated_at = NOW() WHERE id = ?",
    [qcmId, qcmId],
  );

  return Response.json({ generated: questions.length, source: process.env.OPENAI_API_KEY ? "openai" : "template" });
}
