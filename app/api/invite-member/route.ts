export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Verify the caller is authenticated
    const inviterUser = await getServerUser();
    if (!inviterUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviterUid = inviterUser.id;

    // 2. Fetch inviter's user profile
    const { data: inviter } = await adminDb
      .from("users")
      .select("roles, church_id")
      .eq("id", inviterUid)
      .single();

    if (!inviter) {
      return NextResponse.json({ error: "Inviter profile not found" }, { status: 404 });
    }

    const inviterRoles = (inviter.roles ?? []) as Role[];
    const inviterChurchId: string | null = inviter.church_id || null;

    // 3. Only users with members.manage can invite members
    const canInvite = can(inviterRoles, "members.manage");

    if (!canInvite) {
      return NextResponse.json({ error: "You do not have permission to invite members" }, { status: 403 });
    }

    if (!inviterChurchId) {
      return NextResponse.json({ error: "Inviter does not belong to a church" }, { status: 400 });
    }

    // 4. Check if user already exists with this email
    const { data: existingUser } = await adminDb
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let invitedUid = existingUser?.id ?? null;

    // 5. Upsert the invited user profile
    if (!invitedUid) {
      invitedUid = crypto.randomUUID();
    }

    await adminDb
      .from("users")
      .upsert(
        {
          id: invitedUid,
          email,
          first_name: firstName || "",
          last_name: lastName || "",
          roles: [] as Role[],
          church_id: inviterChurchId,
          invited_at: new Date().toISOString(),
          status: "invited",
        },
        { onConflict: "id" }
      );

    return NextResponse.json({ success: true, invitedUid });
  } catch (error) {
    console.error("Invite Member Error:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
