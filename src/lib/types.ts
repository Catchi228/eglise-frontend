export type AnnouncementCategory = "Événement" | "Recherche" | "Autre";

export type Announcement = {
  id: string;
  category: AnnouncementCategory;
  status: "Publiée" | "Désactivée";
  title: string;
  body: string;
  imageUrl?: string;
  imageUrls?: string[];
  city?: string;
  startAt?: string;
  endAt?: string;
  contactEmail?: string;
};

export type CourseStatus = "À venir" | "En cours" | "Terminé";

export type CoursePdfFile = {
  id: string;
  name: string;
  dataUrl: string;
};

export type LessonSection = {
  heading: string;
  body: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: CourseStatus;
  startAt: string;
  endAt: string;
  time: string;
  sections: Array<{ id: string; title: string; durationMin: number }>;
  pdfFiles?: CoursePdfFile[];
  /** Contenu structuré de la leçon (JSON sérialisé) */
  content?: LessonSection[];
};

export type QcmQuestion = {
  id: number;
  prompt: string;
  choices: string[];
};

export type QcmPlay = {
  id: string;
  courseId: string;
  title: string;
  questions: QcmQuestion[];
};

export type CourseQuestion = {
  id: string;
  from: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  createdAt: string;
  answer?: string;
};

export type QcmAttempt = {
  id: number;
  qcmId: string;
  qcmTitle: string;
  courseId: string;
  score: number;
  total: number;
  createdAt: string;
};
