import "server-only";

import { query, type RowDataPacket } from "@/lib/db";
import { fetchAnnouncementsFromDb, fetchCoursesFromDb } from "@/lib/server/siteContent";
import type { Announcement, Course } from "@/lib/types";

export type AdminQcmEntry = {
  id: string;
  courseId: string;
  title: string;
  questionCount: number;
  updatedAt: string;
};

export type AdminMessage = {
  id: string;
  from: string;
  subject: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  createdAt: string;
  courseRef?: string;
};

export type ActivityEntry = {
  id: string;
  type: string;
  label: string;
  ts: number;
};

export type AdminNotification = {
  id: string;
  text: string;
  read: boolean;
  ts: number;
};

type QcmRow = RowDataPacket & {
  id: string;
  course_id: string;
  title: string;
  question_count: number;
  updated_at: Date;
};

type MessageRow = RowDataPacket & {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  course_ref: string | null;
  created_at: Date;
};

type ActivityRow = RowDataPacket & {
  id: number;
  type: string;
  label: string;
  ts: number;
};

type NotifRow = RowDataPacket & {
  id: number;
  text: string;
  is_read: number;
  ts: number;
};

type EmailRow = RowDataPacket & { email: string };

type SettingRow = RowDataPacket & { value: string };

export type AdminBootstrapPayload = {
  announcements: Announcement[];
  courses: Course[];
  qcm: AdminQcmEntry[];
  messages: AdminMessage[];
  activity: ActivityEntry[];
  notifications: AdminNotification[];
  admins: string[];
  principal: string | null;
};

export async function loadAdminBootstrap(): Promise<AdminBootstrapPayload> {
  const [
    announcements,
    courses,
    qcmRows,
    msgRows,
    actRows,
    notifRows,
    adminRows,
    principalRows,
  ] = await Promise.all([
    fetchAnnouncementsFromDb(),
    fetchCoursesFromDb(),
    query<QcmRow[]>(
      "SELECT id, course_id, title, question_count, updated_at FROM qcm ORDER BY updated_at DESC",
    ),
    query<MessageRow[]>(
      "SELECT id, from_email, subject, body, status, course_ref, created_at FROM messages ORDER BY created_at DESC",
    ),
    query<ActivityRow[]>(
      "SELECT id, type, label, ts FROM activity ORDER BY ts DESC LIMIT 40",
    ),
    query<NotifRow[]>(
      "SELECT id, text, is_read, ts FROM notifications ORDER BY ts DESC LIMIT 30",
    ),
    query<EmailRow[]>("SELECT email FROM users WHERE role = 'ADMIN' ORDER BY email"),
    query<SettingRow[]>(
      "SELECT value FROM settings WHERE `key` = 'principal_email' LIMIT 1",
    ),
  ]);

  return {
    announcements,
    courses,
    qcm: qcmRows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      questionCount: r.question_count,
      updatedAt: new Date(r.updated_at).toISOString(),
    })),
    messages: msgRows.map((r) => ({
      id: r.id,
      from: r.from_email,
      subject: r.subject,
      body: r.body,
      status: r.status,
      courseRef: r.course_ref ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    activity: actRows.map((r) => ({
      id: `a-${r.id}`,
      type: r.type,
      label: r.label,
      ts: Number(r.ts),
    })),
    notifications: notifRows.map((r) => ({
      id: `n-${r.id}`,
      text: r.text,
      read: Boolean(r.is_read),
      ts: Number(r.ts),
    })),
    admins: adminRows.map((r) => r.email),
    principal: principalRows[0]?.value ?? null,
  };
}
