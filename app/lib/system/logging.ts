import { adminDb } from "@/app/lib/supabase/admin";

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
  | "SYSTEM_EVENT"
  | "SYSTEM_USER_CREATED";

export type SystemLogTargetType =
  | "USER"
  | "CHURCH"
  | "SYSTEM"
  | "SYSTEM_USER"
  | null;

export interface SystemLogEvent {
  type: SystemLogType;
  actorUid: string;
  actorName?: string | null;

  targetId?: string | null;
  targetType?: SystemLogTargetType;

  message: string;

  metadata?: Record<string, any>;

  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

export async function logSystemEvent(event: SystemLogEvent) {
  const { before, after, metadata, ...rest } = event;

  const { data, error } = await adminDb.from("logs").insert({
    type: rest.type,
    message: rest.message,
    actor_uid: rest.actorUid,
    actor_name: rest.actorName,
    target_id: rest.targetId,
    target_type: rest.targetType,
    before: before,
    after: after,
    metadata: metadata,
    timestamp: new Date().toISOString(),
  });

  if (error) {
    console.error("Error logging system event:", error);
    throw error;
  }
}