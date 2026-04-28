export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function isMissingColumnError(message: string | undefined, columnName: string): boolean {
  const normalized = (message ?? "").toLowerCase();
  return normalized.includes(columnName.toLowerCase()) && normalized.includes("does not exist");
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const calendarSettings =
      typeof body?.calendarSettings === "object" && body.calendarSettings !== null
        ? (body.calendarSettings as Record<string, unknown>)
        : null;

    if (!calendarSettings) {
      return NextResponse.json({
        persisted: false,
        warning: "Missing calendarSettings",
      });
    }

    const { data: userRow, error: readError } = await adminDb
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({
        calendarSettings,
        persisted: false,
        warning: readError.message,
      });
    }

    const nowIso = new Date().toISOString();

    const hasSettingsColumn = userRow ? Object.prototype.hasOwnProperty.call(userRow, "settings") : true;
    const hasLegacyCalendarSettingsColumn = userRow
      ? Object.prototype.hasOwnProperty.call(userRow, "calendar_settings")
      : false;

    if (hasSettingsColumn) {
      const existingSettings =
        userRow && typeof userRow.settings === "object" && userRow.settings !== null
          ? (userRow.settings as Record<string, unknown>)
          : {};

      const mergedSettings = {
        ...existingSettings,
        calendarSettings,
      };

      if (userRow) {
        const { error: updateError } = await adminDb
          .from("users")
          .update({ settings: mergedSettings, updated_at: nowIso })
          .eq("id", authUser.id);

        if (!updateError) {
          return NextResponse.json({ calendarSettings });
        }

        const msg = updateError.message.toLowerCase();
        if (!isMissingColumnError(updateError.message, "settings")) {
          return NextResponse.json({
            calendarSettings,
            persisted: false,
            warning: updateError.message,
          });
        }
      } else {
        const { error: upsertError } = await adminDb
          .from("users")
          .upsert(
            {
              id: authUser.id,
              email: authUser.email ?? "",
              settings: mergedSettings,
              updated_at: nowIso,
            },
            { onConflict: "id" }
          );

        if (!upsertError) {
          return NextResponse.json({ calendarSettings });
        }

        if (!isMissingColumnError(upsertError.message, "settings")) {
          return NextResponse.json({
            calendarSettings,
            persisted: false,
            warning: upsertError.message,
          });
        }
      }
    }

    if (hasLegacyCalendarSettingsColumn || !hasSettingsColumn) {
      if (userRow) {
        const { error: legacyUpdateError } = await adminDb
          .from("users")
          .update({ calendar_settings: calendarSettings, updated_at: nowIso })
          .eq("id", authUser.id);

        if (legacyUpdateError) {
          if (isMissingColumnError(legacyUpdateError.message, "calendar_settings")) {
            return NextResponse.json({
              calendarSettings,
              persisted: false,
              warning: "No user settings column is available in this database.",
            });
          }
          return NextResponse.json({
            calendarSettings,
            persisted: false,
            warning: legacyUpdateError.message,
          });
        }

        return NextResponse.json({ calendarSettings });
      }

      const { error: legacyUpsertError } = await adminDb
        .from("users")
        .upsert(
          {
            id: authUser.id,
            email: authUser.email ?? "",
            calendar_settings: calendarSettings,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        );

      if (legacyUpsertError) {
        if (isMissingColumnError(legacyUpsertError.message, "calendar_settings")) {
          return NextResponse.json({
            calendarSettings,
            persisted: false,
            warning: "No user settings column is available in this database.",
          });
        }
        return NextResponse.json({
          calendarSettings,
          persisted: false,
          warning: legacyUpsertError.message,
        });
      }
    }

    return NextResponse.json({ calendarSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
