/**
 * Ecodim CBT 2026 — 10 cours (une leçon = un cours), contenu texte complet.
 * PDF : généré à la demande via GET /api/courses/[id]/pdf (aucun fichier à ajouter).
 * Leçons 1–3 : Terminé · Leçon 4 : En cours · Leçons 5–10 : À venir.
 *
 * Usage : npm run db:seed:ecodim
 */
import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const coursePdfPath = (id) => `/api/courses/${id}/pdf`;

const LESSON_MONTHS = [
  { start: "01/01/2026", end: "31/01/2026" },
  { start: "01/02/2026", end: "29/02/2026" },
  { start: "01/03/2026", end: "31/03/2026" },
  { start: "01/04/2026", end: "31/05/2026" },
  { start: "01/06/2026", end: "30/06/2026" },
  { start: "01/07/2026", end: "31/07/2026" },
  { start: "01/08/2026", end: "31/08/2026" },
  { start: "01/09/2026", end: "30/09/2026" },
  { start: "01/10/2026", end: "31/10/2026" },
  { start: "01/11/2026", end: "30/11/2026" },
];

const CURRENT_LESSON = 4;

function courseStatus(n) {
  if (n < CURRENT_LESSON) return "Terminé";
  if (n === CURRENT_LESSON) return "En cours";
  return "À venir";
}

// ─── Contenu structuré de chaque leçon ────────────────────────────────────
const LESSONS = [
  {
    n: 1,
    title: "L'importance de l'école du dimanche",
    description: "Formation spirituelle et édification par l'école du dimanche. Références : Josué 1.8 ; 2 Chroniques 17.9 ; Jean 8.31-32 ; Actes 2.42.",
    content: [
      {
        heading: "Introduction",
        body: "L'école du dimanche est un outil essentiel que Dieu a mis en place pour former, édifier et enseigner son peuple dans la connaissance de la Parole. Elle n'est pas simplement une tradition, mais un acte d'obéissance à la grande commission de Jésus-Christ.",
      },
      {
        heading: "Texte de base",
        body: "« Que ce livre de la loi ne s'éloigne point de ta bouche ; médite-le jour et nuit, pour agir fidèlement selon tout ce qui y est écrit ; car c'est alors que tu auras du succès dans tes entreprises, c'est alors que tu réussiras. » — Josué 1.8",
      },
      {
        heading: "Importance de l'enseignement biblique",
        body: "Dans 2 Chroniques 17.7-9, le roi Josaphat envoya des fonctionnaires pour enseigner le peuple dans toutes les villes de Juda avec le livre de la loi. Cela montre que l'instruction dans la Parole de Dieu est une responsabilité communautaire et organisée.\n\nDe même, dans Actes 2.42, les premiers chrétiens « persévéraient dans l'enseignement des apôtres, dans la communion fraternelle, dans la fraction du pain, et dans les prières ». L'enseignement était donc au cœur de la vie de l'Église primitive.",
      },
      {
        heading: "La liberté par la vérité",
        body: "Jésus a déclaré en Jean 8.31-32 : « Si vous demeurez dans ma parole, vous êtes vraiment mes disciples ; vous connaîtrez la vérité, et la vérité vous affranchira. » L'école du dimanche est précisément ce lieu où la vérité est enseignée et apprise, conduisant à une véritable liberté spirituelle.",
      },
      {
        heading: "Applications pratiques",
        body: "1. Participer régulièrement et avec engagement à l'école du dimanche.\n2. Préparer son cœur avant de venir écouter la Parole.\n3. Appliquer dans sa vie quotidienne les enseignements reçus.\n4. Encourager d'autres membres à participer à l'école du dimanche.\n5. Mémoriser les versets clés enseignés chaque semaine.",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Médite-le jour et nuit, pour agir fidèlement selon tout ce qui y est écrit. » — Josué 1.8",
      },
    ],
  },
  {
    n: 2,
    title: "La création et la bonté de Dieu",
    description: "Découvrir la beauté de la création et la bonté de Dieu envers nous. Texte de base : Psaume 104.24 ; verset à mémoriser : Psaume 34.9.",
    content: [
      {
        heading: "Introduction",
        body: "La création est le premier acte de la bonté de Dieu envers l'humanité. En regardant autour de nous — le ciel, la terre, les animaux, les plantes, les étoiles — nous voyons la signature de Dieu et la preuve de son amour infini.",
      },
      {
        heading: "Texte de base",
        body: "« Que tes œuvres sont nombreuses, Éternel ! Tu les as toutes faites avec sagesse ; la terre est remplie de tes biens. » — Psaume 104.24",
      },
      {
        heading: "Dieu, Créateur parfait",
        body: "En Genèse 1, nous lisons sept fois que « Dieu vit que cela était bon ». Chaque chose que Dieu a créée porte le sceau de sa bonté et de sa sagesse. La création n'est pas le fruit du hasard mais d'un Dieu personnel, intelligent et bon.\n\nLe Psaume 104 est tout entier une célébration de la création : les sources, les montagnes, les oiseaux, les lions, les hommes — tout est nourri, soutenu et maintenu par Dieu.",
      },
      {
        heading: "La bonté de Dieu dans la création",
        body: "Dieu n'a pas seulement créé le monde ; il continue de le maintenir. Matthieu 6.26-30 nous rappelle que Dieu nourrit les oiseaux du ciel et revêt les lys des champs. Si Dieu prend soin de la création naturelle, combien plus prend-il soin de ceux qu'il a créés à son image ?\n\nLa bonté de Dieu se manifeste dans :\n• La régularité des saisons\n• La beauté de la nature\n• La nourriture quotidienne\n• L'air que nous respirons\n• La santé et la vie",
      },
      {
        heading: "Notre responsabilité envers la création",
        body: "En Genèse 1.28, Dieu confie à l'homme la gestion de la création : « Remplissez la terre, et l'assujettissez. » Nous sommes intendants, pas propriétaires. Cela implique :\n1. Prendre soin de l'environnement\n2. Ne pas gaspiller les ressources\n3. Reconnaître Dieu comme source de tout bien\n4. Rendre grâce pour chaque bienfait naturel",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Craignez l'Éternel, vous ses saints ! Car rien ne manque à ceux qui le craignent. » — Psaume 34.9",
      },
    ],
  },
  {
    n: 3,
    title: "L'amour de Dieu pour nous",
    description: "Comment Dieu nous aime et comment répondre à son amour. Textes : Jean 3.16 ; Romains 5.8 ; 1 Jean 4.7-21.",
    content: [
      {
        heading: "Introduction",
        body: "L'amour de Dieu est la vérité la plus profonde et la plus transformatrice de toute l'Écriture. Ce n'est pas un amour conditionnel ni méritoire — c'est un amour souverain, inconditionnel et éternel qui cherche l'homme même dans sa rébellion.",
      },
      {
        heading: "Texte de base",
        body: "« Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle. » — Jean 3.16",
      },
      {
        heading: "La preuve de l'amour de Dieu",
        body: "Romains 5.8 est l'une des déclarations les plus puissantes de la Bible sur l'amour divin : « Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous. »\n\nDieu n'a pas attendu que nous soyons bons pour nous aimer. Il nous a aimés dans notre état de péché, de rébellion, de faiblesse. Cela distingue l'amour de Dieu de tout amour humain.",
      },
      {
        heading: "L'amour comme caractère de Dieu",
        body: "En 1 Jean 4.8, l'apôtre va plus loin : « Dieu est amour. » L'amour n'est pas seulement quelque chose que Dieu fait ; c'est ce qu'il est. De sa nature même découle un amour infini et parfait.\n\n1 Jean 4.9-10 précise : « En ceci l'amour de Dieu a été manifesté envers nous, que Dieu a envoyé son Fils unique dans le monde, afin que nous vivions par lui. »",
      },
      {
        heading: "Comment répondre à l'amour de Dieu",
        body: "1 Jean 4.19-21 nous enseigne : « Nous, nous l'aimons, parce qu'il nous a aimés le premier. »\n\nNotre réponse à l'amour de Dieu doit être :\n1. Accepter cet amour par la foi en Jésus-Christ\n2. Aimer Dieu de tout notre cœur, âme, force et pensée\n3. Aimer notre prochain comme nous-mêmes\n4. Vivre en témoins de cet amour devant le monde\n5. Refuser de vivre dans la peur, car « l'amour parfait bannit la crainte » (1 Jean 4.18)",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Nous aimons, parce qu'il nous a aimés le premier. » — 1 Jean 4.19",
      },
    ],
  },
  {
    n: 4,
    title: "Jésus notre Sauveur",
    description: "La vie, la mort et la résurrection de Jésus-Christ et son amour pour nous. Texte de base : Romains 5.6-8.",
    content: [
      {
        heading: "Introduction",
        body: "Le cœur du message chrétien est Jésus-Christ : qui il est, ce qu'il a fait, et ce qu'il continue de faire pour nous. Jésus n'est pas simplement un grand enseignant ou un exemple moral — il est le Sauveur du monde, le seul médiateur entre Dieu et les hommes.",
      },
      {
        heading: "Texte de base",
        body: "« Car, lorsque nous étions encore sans force, Christ, au temps marqué, est mort pour des impies. À peine mourrait-on pour un juste ; quelqu'un peut-être mourrait-il pour un homme de bien. Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous. » — Romains 5.6-8",
      },
      {
        heading: "L'identité de Jésus",
        body: "Jésus-Christ est pleinement Dieu et pleinement homme — l'unique Fils de Dieu incarné (Jean 1.1-14). Il est :\n• Le Verbe fait chair\n• L'Emmanuel (Dieu avec nous)\n• Le bon Berger (Jean 10.11)\n• La résurrection et la vie (Jean 11.25)\n• Le chemin, la vérité et la vie (Jean 14.6)",
      },
      {
        heading: "La mort et la résurrection de Christ",
        body: "Sur la croix, Jésus a pris sur lui le péché du monde entier. 2 Corinthiens 5.21 dit : « Celui qui n'a pas connu le péché, il l'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu. »\n\nMais la croix n'est pas la fin ! La résurrection de Jésus le troisième jour est la preuve de sa victoire sur la mort et le péché. 1 Corinthiens 15.17 affirme : « Si Christ n'est pas ressuscité, votre foi est vaine. »\n\nGrâce à la résurrection :\n• Notre foi a un fondement réel\n• Nous avons l'espérance de la vie éternelle\n• Nous sommes justifiés devant Dieu\n• Nous pouvons vivre une vie nouvelle",
      },
      {
        heading: "Comment recevoir le salut",
        body: "Romains 10.9-10 nous montre le chemin : « Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l'a ressuscité des morts, tu seras sauvé. »\n\nLe salut est reçu par :\n1. La repentance : reconnaître notre état de pécheur\n2. La foi : croire que Jésus est mort et ressuscité pour nous\n3. La confession : reconnaître Jésus comme Seigneur et Sauveur\n4. Le baptême : témoignage public de notre nouvelle naissance\n5. Une vie nouvelle : marcher selon l'Esprit",
      },
      {
        heading: "Jésus, notre Sauveur aujourd'hui",
        body: "Jésus n'est pas seulement notre Sauveur d'hier — il est vivant et agit aujourd'hui. Hébreux 7.25 dit qu'il « est toujours vivant pour intercéder pour eux ». Il est notre :\n• Grand Prêtre qui intercède pour nous\n• Avocat auprès du Père (1 Jean 2.1)\n• Berger qui nous guide et nous protège\n• Roi qui reviendra dans la gloire",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous. » — Romains 5.8",
      },
    ],
  },
  {
    n: 5,
    title: "L'identité en Christ (identité chrétienne)",
    description: "Découvrir qui nous sommes en Christ et vivre conformément à cette identité. Texte de base : Jean 1.12.",
    content: [
      {
        heading: "Introduction",
        body: "Savoir qui nous sommes en Christ est fondamental pour vivre une vie chrétienne victorieuse. Beaucoup de chrétiens vivent en dessous de leur identité réelle parce qu'ils ne connaissent pas ce que la Bible dit sur eux. Cette leçon explore notre identité nouvelle en Jésus-Christ.",
      },
      {
        heading: "Texte de base",
        body: "« Mais à tous ceux qui l'ont reçu, à ceux qui croient en son nom, il a donné le pouvoir de devenir enfants de Dieu. » — Jean 1.12",
      },
      {
        heading: "Enfants de Dieu",
        body: "La première et la plus profonde vérité sur notre identité est que nous sommes enfants de Dieu (Jean 1.12 ; 1 Jean 3.1-2). Ce n'est pas une métaphore — c'est une réalité spirituelle. Nous avons été adoptés dans la famille de Dieu (Romains 8.15-17), ce qui signifie :\n• Nous avons accès au Père à tout moment\n• Nous sommes héritiers de Dieu et cohéritiers de Christ\n• Nous portons le nom et le caractère de notre Père",
      },
      {
        heading: "Nouvelle création",
        body: "2 Corinthiens 5.17 déclare : « Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées ; voici, toutes choses sont devenues nouvelles. »\n\nEn Christ, nous ne sommes plus définis par :\n• Notre passé de péché\n• Nos erreurs et échecs\n• Notre origine ou condition sociale\n• Les étiquettes que les autres nous donnent\n\nNous sommes définis par ce que Dieu dit de nous.",
      },
      {
        heading: "Qui sommes-nous en Christ ?",
        body: "La Bible nous dit que nous sommes :\n• Bien-aimés et choisis (Éphésiens 1.4)\n• Justifiés et réconciliés (Romains 5.1)\n• Affranchis du péché (Romains 6.18)\n• Habitacle du Saint-Esprit (1 Corinthiens 6.19)\n• Ambassadeurs de Christ (2 Corinthiens 5.20)\n• Plus que vainqueurs (Romains 8.37)\n• Lumière du monde (Matthieu 5.14)",
      },
      {
        heading: "Vivre selon notre identité",
        body: "Connaître notre identité ne suffit pas — nous devons la vivre. Éphésiens 4.1 nous exhorte à « marcher d'une manière digne de la vocation qui nous a été adressée ».\n\nCela implique :\n1. Renouveler notre pensée par la Parole (Romains 12.2)\n2. Rejeter les pensées contraires à notre identité en Christ\n3. Parler de nous-mêmes comme Dieu parle de nous\n4. Agir en cohérence avec qui nous sommes\n5. Résister au diable qui veut nous faire douter de notre identité",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Il a donné le pouvoir de devenir enfants de Dieu. » — Jean 1.12b",
      },
    ],
  },
  {
    n: 6,
    title: "Le Saint-Esprit, notre guide",
    description: "Comprendre le rôle du Saint-Esprit et marcher selon sa direction. Texte de base : Jean 16.13 ; Romains 8.14.",
    content: [
      {
        heading: "Introduction",
        body: "Jésus n'a pas laissé ses disciples orphelins. Avant de monter au ciel, il leur a promis un Consolateur, un Aide — le Saint-Esprit. Comprendre le rôle et l'œuvre du Saint-Esprit est indispensable pour toute vie chrétienne authentique.",
      },
      {
        heading: "Texte de base",
        body: "« Quand le Consolateur sera venu, l'Esprit de vérité, il vous conduira dans toute la vérité. » — Jean 16.13\n\n« Car tous ceux qui sont conduits par l'Esprit de Dieu sont fils de Dieu. » — Romains 8.14",
      },
      {
        heading: "Qui est le Saint-Esprit ?",
        body: "Le Saint-Esprit est la troisième personne de la Trinité — pleinement Dieu, égal au Père et au Fils. Il n'est pas une force ou une énergie impersonnelle, mais une personne divine avec :\n• Une intelligence (Romains 8.27)\n• Une volonté (1 Corinthiens 12.11)\n• Des émotions — on peut le contrister (Éphésiens 4.30)",
      },
      {
        heading: "L'œuvre du Saint-Esprit",
        body: "Le Saint-Esprit accomplit plusieurs œuvres essentielles dans la vie du croyant :\n\n1. Il convainc de péché et conduit à la repentance (Jean 16.8)\n2. Il régénère et donne la nouvelle naissance (Jean 3.5-6)\n3. Il habite dans le croyant comme temple (1 Corinthiens 6.19)\n4. Il enseigne et rappelle les paroles de Jésus (Jean 14.26)\n5. Il produit le fruit de l'Esprit : amour, joie, paix, patience, bonté, bienveillance, fidélité, douceur, maîtrise de soi (Galates 5.22-23)\n6. Il donne des dons spirituels pour l'édification de l'Église (1 Corinthiens 12)\n7. Il intercède pour nous (Romains 8.26)",
      },
      {
        heading: "Marcher selon l'Esprit",
        body: "Galates 5.16 nous exhorte : « Marchez selon l'Esprit, et vous n'accomplirez pas les désirs de la chair. »\n\nMarcher selon l'Esprit, c'est :\n• Lire et méditer la Parole de Dieu quotidiennement\n• Prier en tout temps (1 Thessaloniciens 5.17)\n• Obéir aux impulsions et convictions du Saint-Esprit\n• Refuser de faire taire sa voix dans notre cœur\n• Vivre dans la communion avec les autres croyants",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Tous ceux qui sont conduits par l'Esprit de Dieu sont fils de Dieu. » — Romains 8.14",
      },
    ],
  },
  {
    n: 7,
    title: "Pureté et sainteté dans un monde corrompu",
    description: "Vivre la pureté et la sainteté au milieu d'un monde corrompu. Textes : Genèse 6 ; Daniel 1 ; 1 Pierre 2.11-17.",
    content: [
      {
        heading: "Introduction",
        body: "Nous vivons dans un monde qui glorifie le péché et relativise les valeurs morales. Pourtant, l'appel de Dieu à son peuple n'a pas changé : « Soyez saints, car je suis saint » (1 Pierre 1.16). Cette leçon explore comment maintenir notre pureté et notre sainteté dans ce contexte difficile.",
      },
      {
        heading: "Texte de base",
        body: "« Bien-aimés, je vous exhorte, comme étrangers et voyageurs, à vous abstenir des convoitises charnelles qui font la guerre à l'âme. » — 1 Pierre 2.11",
      },
      {
        heading: "Le monde au temps de Noé",
        body: "Genèse 6.5-6 nous montre l'état du monde avant le déluge : « L'Éternel vit que la méchanceté des hommes était grande sur la terre, et que toutes les pensées de leur cœur se portaient chaque jour uniquement vers le mal. »\n\nPourtant, Noé était « juste et intègre dans sa génération » (Genèse 6.9). Il est possible de vivre sainement même dans un environnement corrompu. Noé n'a pas changé ses convictions pour plaire à ses contemporains.",
      },
      {
        heading: "L'exemple de Daniel",
        body: "Daniel 1 nous présente un jeune homme déporté à Babylone — exposé à la culture, la philosophie et les mœurs d'une civilisation totalement différente. Mais Daniel « résolut dans son cœur de ne pas se souiller » (Daniel 1.8).\n\nLa sainteté commence dans le cœur — c'est une résolution intérieure avant d'être un comportement extérieur. Daniel a tenu bon parce qu'il avait décidé à l'avance ce qu'il ferait face aux pressions du monde.",
      },
      {
        heading: "L'appel à la sainteté",
        body: "1 Pierre 2.11-12 nous appelle à être des « étrangers et voyageurs » dans ce monde — des gens dont la citoyenneté première est céleste. Cela signifie :\n\n1. Se garder des péchés évidents : immoralité sexuelle, ivresse, malhonnêteté\n2. Renouveler continuellement son esprit (Romains 12.2)\n3. Fuir les situations tentatrices (2 Timothée 2.22)\n4. Cultiver des amitiés qui nous élèvent spirituellement\n5. Veiller sur ses pensées, ses regards, ses paroles\n\nÉphésiens 5.3-4 est clair : « Que parmi vous il ne soit pas même question de fornication, ni d'aucune impureté... »",
      },
      {
        heading: "La sainteté est possible",
        body: "La sainteté n'est pas une idéal impossible — c'est la vocation de tout croyant, rendue possible par le Saint-Esprit qui habite en nous. 2 Pierre 1.3 dit que « sa divine puissance nous a donné tout ce qui contribue à la vie et à la piété ».\n\nNous ne luttons pas seuls : nous avons la Parole, le Saint-Esprit, la prière et la communauté fraternelle.",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Fuis les passions de la jeunesse, et recherche la justice, la foi, la charité, la paix. » — 2 Timothée 2.22",
      },
    ],
  },
  {
    n: 8,
    title: "Mission et évangélisation",
    description: "Placer l'évangélisation et la mission au cœur de la vie de l'Église. Texte de base : Matthieu 28.18-20 ; Actes 1.8.",
    content: [
      {
        heading: "Introduction",
        body: "L'évangélisation n'est pas une activité optionnelle pour les chrétiens — c'est le commandement central de notre Seigneur. « Allez ! » — ce mot simple contient toute la mission de l'Église dans le monde. Chaque croyant est appelé à être témoin.",
      },
      {
        heading: "Texte de base",
        body: "« Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit. » — Matthieu 28.19-20\n\n« Vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre. » — Actes 1.8",
      },
      {
        heading: "La grande commission",
        body: "Matthieu 28.18-20 est connue comme « la grande commission ». Elle contient quatre éléments essentiels :\n\n1. L'autorité : « Tout pouvoir m'a été donné » — Jésus parle avec toute autorité\n2. Le commandement : « Allez » — un appel à l'action, pas à rester passifs\n3. La mission : « Faites de toutes les nations des disciples » — pas seulement évangéliser mais former\n4. La promesse : « Je suis avec vous tous les jours » — nous ne partons pas seuls",
      },
      {
        heading: "Témoins à partir de là où nous sommes",
        body: "Actes 1.8 nous donne une stratégie géographique et progressive :\n• Jérusalem = là où nous habitons (notre famille, nos voisins)\n• Judée = notre région, notre ville\n• Samarie = ceux qui nous sont différents, qui nous ont blessés\n• Les extrémités de la terre = les nations\n\nL'évangélisation commence à la maison et dans notre entourage immédiat. On ne peut pas être passionné pour les nations si on néglige ceux qui sont à côté de nous.",
      },
      {
        heading: "Comment évangéliser",
        body: "1. Par l'exemple de notre vie : vivre une vie qui attire (Matthieu 5.16)\n2. Par nos paroles : être prêts à rendre compte de notre espérance (1 Pierre 3.15)\n3. Par les actes de bonté : aider les pauvres, les malades, les marginalisés\n4. Par la prière : intercéder pour les non-croyants autour de nous\n5. Par la formation : apprendre à partager l'Évangile clairement et simplement",
      },
      {
        heading: "Obstacles à l'évangélisation",
        body: "• La peur du rejet ou du ridicule\n• L'ignorance de comment présenter l'Évangile\n• L'incohérence entre notre vie et notre message\n• Le manque de compassion pour les perdus\n\nCes obstacles se surmontent par la prière, la Parole et la pratique.",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Vous serez mes témoins jusqu'aux extrémités de la terre. » — Actes 1.8b",
      },
    ],
  },
  {
    n: 9,
    title: "Les défis de la jeunesse chrétienne",
    description: "Défis spirituels, moraux et sociaux de la jeunesse ; modèles bibliques et engagement pratique. Texte : 1 Timothée 4.12.",
    content: [
      {
        heading: "Introduction",
        body: "La jeunesse est une période stratégique de la vie — pleine d'opportunités, mais aussi de défis particuliers. L'Écriture offre une vision positive et ambitieuse pour les jeunes : ne pas se laisser mépriser à cause de leur âge, mais être des modèles pour les croyants.",
      },
      {
        heading: "Texte de base",
        body: "« Que personne ne méprise ta jeunesse ; mais sois un modèle pour les fidèles, en parole, en conduite, en amour, en foi, en pureté. » — 1 Timothée 4.12",
      },
      {
        heading: "Les principaux défis",
        body: "Les jeunes chrétiens font face à des défis spécifiques :\n\n1. La pression des pairs : être différent dans un groupe qui ne partage pas les mêmes valeurs\n2. La tentation sexuelle : immoralité normalisée dans les médias et la culture\n3. Les réseaux sociaux : distraction, comparaison, fausses identités\n4. Les drogues et l'alcool : proposés comme voie d'évasion ou d'intégration\n5. Le doute et le questionnement : remettre en question la foi transmise par les parents\n6. La pression académique et professionnelle : réussir à tout prix",
      },
      {
        heading: "Modèles bibliques de jeunesse fidèle",
        body: "La Bible nous donne plusieurs exemples de jeunes qui ont tenu ferme :\n\n• Joseph : résiste à la séduction de la femme de Potiphar (Genèse 39)\n• Daniel, Shadrach, Meshach, Abed-Nego : refusent de se compromettre à Babylone\n• Timothée : devenu pasteur malgré sa jeunesse\n• Josias : devient roi à 8 ans et réforme le pays (2 Rois 22)\n\nCes exemples montrent que l'âge n'est pas un obstacle à la fidélité et à l'influence.",
      },
      {
        heading: "Être un modèle selon 1 Timothée 4.12",
        body: "Paul appelle Timothée à être un modèle dans cinq domaines :\n\n1. En parole : parler avec sagesse, honnêteté, edification\n2. En conduite : avoir un comportement irréprochable\n3. En amour : aimer sincèrement Dieu et le prochain\n4. En foi : faire confiance à Dieu même face aux difficultés\n5. En pureté : garder son cœur, son corps et ses pensées purs",
      },
      {
        heading: "Conseils pratiques",
        body: "1. Commencer chaque journée par la prière et la lecture de la Bible\n2. Choisir ses amis avec soin — les relations forment le caractère\n3. S'engager dans un groupe de jeunes chrétiens sain\n4. Trouver un mentor spirituel adulte\n5. Mettre des filtres sur ses appareils numériques\n6. Servir dans l'Église dès maintenant, ne pas attendre d'être adulte",
      },
      {
        heading: "Verset à mémoriser",
        body: "« Comment le jeune homme rendra-t-il pur son sentier ? En se dirigeant d'après ta parole. » — Psaume 119.9",
      },
    ],
  },
  {
    n: 10,
    title: "Le chrétien face aux épreuves et aux maladies",
    description: "Attitudes face aux épreuves et aux maladies ; garder la foi. Textes : Job 1-2 ; 1 Pierre 5.6-10 ; 1 Corinthiens 10.13.",
    content: [
      {
        heading: "Introduction",
        body: "Nul chrétien n'est à l'abri des épreuves et des maladies. La question n'est pas « si » nous passerons par des moments difficiles, mais « comment » nous les traverserons. La Bible offre une vision complète de la souffrance et des ressources pour y faire face.",
      },
      {
        heading: "Texte de base",
        body: "« Aucune tentation ne vous est survenue qui n'ait été humaine, et Dieu, qui est fidèle, ne permettra pas que vous soyez tentés au-delà de vos forces ; mais avec la tentation il préparera aussi le moyen d'en sortir, afin que vous puissiez la supporter. » — 1 Corinthiens 10.13",
      },
      {
        heading: "L'exemple de Job",
        body: "Job représente le paradigme de l'épreuve : un homme juste, béni de Dieu, qui perd en un instant ses richesses, ses enfants et sa santé. Face à tout cela, sa première réaction est remarquable : « L'Éternel a donné, et l'Éternel a ôté ; que le nom de l'Éternel soit béni ! » (Job 1.21).\n\nJob ne comprend pas pourquoi il souffre — mais il ne renie pas son Dieu. Sa foi est mise à l'épreuve jusqu'à ses limites, mais elle tient. Et à la fin, Dieu le restaure doublement (Job 42.10-12).",
      },
      {
        heading: "Pourquoi les épreuves ?",
        body: "La Bible offre plusieurs perspectives sur la souffrance :\n\n1. Elles permettent d'épurer et fortifier notre foi (1 Pierre 1.6-7 — comme l'or dans le feu)\n2. Elles développent la patience, le caractère, l'espérance (Romains 5.3-4)\n3. Elles nous rapprochent de Dieu en nous faisant dépendre de lui\n4. Elles nous permettent de consoler d'autres qui souffrent (2 Corinthiens 1.4)\n5. Parfois, elles sont la conséquence de nos choix pécheurs\n\nAttention : toute souffrance n'est pas une punition divine. Job était juste et souffrait quand même.",
      },
      {
        heading: "Comment traverser les épreuves",
        body: "1 Pierre 5.6-10 nous donne une feuille de route :\n\n1. « Humiliez-vous sous la puissante main de Dieu » (v.6) : reconnaître notre dépendance de Dieu\n2. « Déchargez-vous sur lui de tous vos soucis » (v.7) : la prière est le lieu du transfert de nos fardeaux\n3. « Soyez sobres et vigilants » (v.8) : l'ennemi profite de nos moments de faiblesse\n4. « Résistez-lui avec une foi ferme » (v.9) : la résistance active, pas la résignation passive\n5. « Le Dieu de toute grâce vous fortifiera » (v.10) : la promesse de Dieu au terme de l'épreuve",
      },
      {
        heading: "La maladie et la guérison",
        body: "La maladie est une réalité que tout chrétien peut rencontrer. La Bible nous encourage à :\n• Prier pour la guérison avec foi (Jacques 5.14-15)\n• Recourir aussi à la médecine, don de Dieu à l'humanité (Luc était médecin)\n• Garder la confiance en Dieu même si la guérison ne vient pas immédiatement\n• Témoigner de la grâce de Dieu même dans la maladie\n• Accepter le soutien et la prière de la communauté",
      },
      {
        heading: "La promesse finale",
        body: "Apocalypse 21.4 nous offre l'horizon ultime : « Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n'y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu. »\n\nNos épreuves présentes sont temporaires — la gloire à venir est éternelle (Romains 8.18).",
      },
      {
        heading: "Verset à mémoriser",
        body: "« J'ai renversé toutes ces choses sur vous ; mais vous n'êtes pas revenus à moi, dit l'Éternel. » (Amos 4.11) — « Dieu fidèle ne permettra pas que vous soyez tentés au-delà de vos forces. » — 1 Corinthiens 10.13b",
      },
    ],
  },
];

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "eglise",
} = process.env;

const conn = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT),
  user: DB_USER, password: DB_PASSWORD,
  database: DB_NAME, charset: "utf8mb4",
});

// Ajoute la colonne content si elle n'existe pas
await conn.execute(
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS content LONGTEXT DEFAULT NULL`,
).catch(() => {});
console.log("Colonne content vérifiée/ajoutée.");

async function removeCourse(id) {
  await conn.execute("DELETE FROM course_pdfs WHERE course_id = ?", [id]);
  await conn.execute("DELETE FROM course_sections WHERE course_id = ?", [id]);
  await conn.execute("DELETE FROM course_tags WHERE course_id = ?", [id]);
  const [qcmRows] = await conn.execute("SELECT id FROM qcm WHERE course_id = ?", [id]);
  for (const row of qcmRows) {
    await conn.execute("DELETE FROM qcm_questions WHERE qcm_id = ?", [row.id]);
  }
  await conn.execute("DELETE FROM qcm WHERE course_id = ?", [id]);
  await conn.execute("DELETE FROM courses WHERE id = ?", [id]);
}

for (const id of ["c1", "c2", "c3", "ecodim-2026"]) await removeCourse(id);
for (let i = 1; i <= 10; i++) await removeCourse(`ecodim-2026-l${String(i).padStart(2, "0")}`);
console.log("Anciens cours retirés.");

for (const L of LESSONS) {
  const id     = `ecodim-2026-l${String(L.n).padStart(2, "0")}`;
  const month  = LESSON_MONTHS[L.n - 1];
  const status = courseStatus(L.n);
  const title  = `Leçon ${L.n} — ${L.title}`;

  await conn.execute(
    `INSERT INTO courses (id, title, description, content, status, start_at, end_at, time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title=VALUES(title), description=VALUES(description), content=VALUES(content),
       status=VALUES(status), start_at=VALUES(start_at), end_at=VALUES(end_at), time=VALUES(time)`,
    [id, title, L.description, JSON.stringify(L.content), status, month.start, month.end, "09:00"],
  );

  await conn.execute(`DELETE FROM course_tags WHERE course_id = ?`, [id]);
  for (const tag of ["Ecodim", "CBT 2026", "École du dimanche", `Leçon ${L.n}`]) {
    await conn.execute(`INSERT INTO course_tags (course_id, tag) VALUES (?, ?)`, [id, tag]);
  }

  await conn.execute(`DELETE FROM course_sections WHERE course_id = ?`, [id]);
  await conn.execute(
    `INSERT INTO course_sections (id, course_id, title, duration_min, position) VALUES (?, ?, ?, ?, 0)`,
    [`${id}-s1`, id, "Étude et discussion", 60],
  );

  await conn.execute(`DELETE FROM course_pdfs WHERE course_id = ?`, [id]);
  if (status !== "À venir") {
    await conn.execute(
      `INSERT INTO course_pdfs (id, course_id, name, path) VALUES (?, ?, ?, ?)`,
      [`${id}-pdf`, id, `${title}.pdf`, coursePdfPath(id)],
    );
  }

  console.log(`  ${id} [${status}] ${title}`);
}

await conn.end();
console.log(`\n10 leçons Ecodim CBT 2026 : leçons 1–3 terminées, leçon 4 en cours, 5–10 à venir.`);
console.log(`PDF : génération automatique (/api/courses/[id]/pdf) — aucun fichier à déposer.`);
