// Seed initial : crée l'admin principal et insère les mocks d'annonces et de cours.
// Exécuté après db/schema.sql par `npm run db:init`.

import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { createDbClient } from "./db-client.mjs";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const {
  SEED_ADMIN_EMAIL = "admin@cbdtogo.org",
  SEED_ADMIN_PASSWORD = "admin123",
} = process.env;

const db = createDbClient();
console.log("Connexion PostgreSQL OK");

const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

await db.execute(
  `INSERT INTO users (email, password_hash, role, is_principal)
   VALUES (?, ?, 'ADMIN', TRUE)
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash,
                                     role = 'ADMIN',
                                     is_principal = TRUE`,
  [SEED_ADMIN_EMAIL.toLowerCase(), passwordHash],
);

await db.execute(
  `INSERT INTO settings (key, value)
   VALUES ('principal_email', ?)
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  [SEED_ADMIN_EMAIL.toLowerCase()],
);

console.log(`Admin principal: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);

const announcements = [
  {
    id: "a1",
    category: "Événement",
    status: "Publiée",
    title: "Journée portes ouvertes",
    body: "Nous vous invitons à notre journée portes ouvertes ce dimanche. Venez découvrir notre communauté et partager un moment de convivialité.",
    images: [
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
    ],
    city: "Paris 15ème",
    startAt: "03/05/2026",
    endAt: "03/05/2026",
    contactEmail: "contact@cbdtogo.org",
  },
  {
    id: "a2",
    category: "Recherche",
    status: "Publiée",
    title: "Recherche bénévoles pour le groupe de jeunes",
    body: "Nous recherchons des bénévoles pour accompagner le groupe de jeunes lors des activités du mercredi après-midi.",
    images: [
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
    ],
    city: "Paris 15ème",
    startAt: "29/04/2026",
    endAt: "30/06/2026",
    contactEmail: "jeunes@cbdtogo.org",
  },
  {
    id: "a3",
    category: "Autre",
    status: "Publiée",
    title: "Vente de livres chrétiens",
    body: "Vente de livres chrétiens d'occasion en bon état. Prix abordables. Contact par email pour plus d'informations.",
    images: [
      "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1600&q=80",
    ],
    city: "Paris 14ème",
    startAt: "28/04/2026",
    endAt: "15/05/2026",
    contactEmail: "marie.dupont@email.fr",
  },
];

for (const a of announcements) {
  await db.execute(
    `INSERT INTO announcements
       (id, category, status, title, body, city, start_at, end_at, contact_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       category = EXCLUDED.category,
       status = EXCLUDED.status,
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       city = EXCLUDED.city,
       start_at = EXCLUDED.start_at,
       end_at = EXCLUDED.end_at,
       contact_email = EXCLUDED.contact_email`,
    [a.id, a.category, a.status, a.title, a.body, a.city, a.startAt, a.endAt, a.contactEmail],
  );
  await db.execute(`DELETE FROM announcement_images WHERE announcement_id = ?`, [a.id]);
  let pos = 0;
  for (const url of a.images) {
    await db.execute(
      `INSERT INTO announcement_images (announcement_id, path, position) VALUES (?, ?, ?)`,
      [a.id, url, pos++],
    );
  }
}

console.log(`Annonces seedées: ${announcements.length}`);

const courses = [
  {
    id: "c1",
    title: "Les Épîtres de Paul",
    description:
      "Étude approfondie des lettres de l'apôtre Paul aux premières églises chrétiennes.",
    tags: ["Nouveau Testament", "Épîtres"],
    status: "En cours",
    startAt: "20/04/2026",
    endAt: "25/05/2026",
    time: "10:00",
    sections: [
      { id: "c1-s1", title: "Introduction aux Épîtres", durationMin: 45 },
      { id: "c1-s2", title: "Romains 1-8", durationMin: 60 },
      { id: "c1-s3", title: "Corinthiens et Galates", durationMin: 50 },
    ],
  },
  {
    id: "c2",
    title: "Les Psaumes — Louange et Adoration",
    description:
      "Découvrir la prière, la louange et l'adoration à travers les Psaumes.",
    tags: ["Ancien Testament", "Louange"],
    status: "À venir",
    startAt: "10/05/2026",
    endAt: "30/06/2026",
    time: "19:00",
    sections: [
      { id: "c2-s1", title: "Introduction", durationMin: 30 },
      { id: "c2-s2", title: "Psaumes de David", durationMin: 55 },
    ],
  },
  {
    id: "c3",
    title: "L'Évangile selon Jean — Fondements",
    description:
      "Parcours guidé de l'Évangile de Jean : identité de Jésus, foi, signes et vie nouvelle.",
    tags: ["Nouveau Testament", "Évangiles"],
    status: "Terminé",
    startAt: "05/01/2026",
    endAt: "15/02/2026",
    time: "10:00",
    sections: [
      { id: "c3-s1", title: "Prologue (Jean 1)", durationMin: 40 },
      { id: "c3-s2", title: "Signes et foi", durationMin: 55 },
    ],
  },
];

for (const c of courses) {
  await db.execute(
    `INSERT INTO courses (id, title, description, status, start_at, end_at, time)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       status = EXCLUDED.status,
       start_at = EXCLUDED.start_at,
       end_at = EXCLUDED.end_at,
       time = EXCLUDED.time`,
    [c.id, c.title, c.description, c.status, c.startAt, c.endAt, c.time],
  );

  await db.execute(`DELETE FROM course_tags WHERE course_id = ?`, [c.id]);
  for (const tag of c.tags) {
    await db.execute(`INSERT INTO course_tags (course_id, tag) VALUES (?, ?)`, [c.id, tag]);
  }

  await db.execute(`DELETE FROM course_sections WHERE course_id = ?`, [c.id]);
  let pos = 0;
  for (const s of c.sections) {
    await db.execute(
      `INSERT INTO course_sections (id, course_id, title, duration_min, position)
       VALUES (?, ?, ?, ?, ?)`,
      [s.id, c.id, s.title, s.durationMin, pos++],
    );
  }
}

console.log(`Cours seedés: ${courses.length}`);

const now = Date.now();
await db.execute(
  `INSERT INTO messages (id, from_email, subject, body, status, course_ref, created_at)
   VALUES (?, ?, ?, ?, ?, ?, to_timestamp(?))
   ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject`,
  [
    "m-seed-1",
    "jean.martin@email.fr",
    "Question sur le cours « Les Épîtres de Paul »",
    "Bonjour, pourriez-vous préciser la date du prochain quiz ? Merci.",
    "nouveau",
    "c1",
    Math.floor((now - 3600 * 1000) / 1000),
  ],
);

await db.execute(
  `INSERT INTO messages (id, from_email, subject, body, status, course_ref, created_at)
   VALUES (?, ?, ?, ?, ?, NULL, to_timestamp(?))
   ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject`,
  [
    "m-seed-2",
    "sophie.k@email.fr",
    "Accès Bible hors ligne",
    "Le téléchargement des chapitres échoue sur mon téléphone.",
    "lu",
    Math.floor((now - 86400 * 1000 * 2) / 1000),
  ],
);

console.log("Messages seedés: 2");

const qcmId = "qcm-c1-eval";
await db.execute(
  `INSERT INTO qcm (id, course_id, title, question_count, updated_at)
   VALUES (?, 'c1', 'Évaluation — Les Épîtres de Paul', 3, NOW())
   ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, question_count = EXCLUDED.question_count`,
  [qcmId],
);
await db.execute("DELETE FROM qcm_questions WHERE qcm_id = ?", [qcmId]);
const questions = [
  {
    prompt: "Qui a écrit la majorité des épîtres du Nouveau Testament ?",
    choices: ["Pierre", "Paul", "Jean", "Jacques"],
    correct: 1,
  },
  {
    prompt: "À quelle Église Paul adresse-t-il une lettre sur la justification par la foi ?",
    choices: ["Corinthe", "Éphèse", "Rome", "Philippi"],
    correct: 2,
  },
  {
    prompt: "Quel thème central traverse les Épîtres pauliniennes ?",
    choices: ["La loi seule", "La grâce en Jésus-Christ", "Le temple", "Les prophètes"],
    correct: 1,
  },
];
let pos = 0;
for (const q of questions) {
  await db.execute(
    `INSERT INTO qcm_questions (qcm_id, prompt, choices, correct_index, position)
     VALUES (?, ?, ?, ?, ?)`,
    [qcmId, q.prompt, JSON.stringify(q.choices), q.correct, pos++],
  );
}
console.log("QCM seedé pour le cours c1");

await db.end();
console.log("Seed terminé.");
