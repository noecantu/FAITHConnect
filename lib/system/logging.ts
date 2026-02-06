import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export type SystemLogType =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "CHURCH_CREATED"
  | "CHURCH_UPDATED"
  | "CHURCH_DELETED"
  | "ROLE_UPDATED"
  | "SETTINGS_UPDATED"
  | "ERROR"
  | "SYSTEM_EVENT";

export interface SystemLogEvent {
  type: SystemLogType;
  actorUid: string;
  actorName?: string | null;

  targetId?: string | null;
  targetType?: "USER" | "CHURCH" | "SYSTEM" | null;

  message: string;

  metadata?: Record<string, any>;

  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

export async function logSystemEvent(event: SystemLogEvent) {
  const { before, after, ...rest } = event;

  const payload: any = {
    ...rest,
    timestamp: FieldValue.serverTimestamp(),
  };

  // Only include diffs if provided
  if (before !== undefined) payload.before = before;
  if (after !== undefined) payload.after = after;

  await adminDb.collection("systemLogs").add(payload);
}
