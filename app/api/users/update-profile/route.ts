export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = user.id;
    const body = await req.json();
    const { firstName, lastName, profilePhotoUrl } = body;

    // Fetch actor profile to ensure user exists
    const { data: userData, error: fetchError } = await adminDb
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Whitelist fields that can be updated
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (typeof firstName === "string") updates.first_name = firstName;
    if (typeof lastName === "string") updates.last_name = lastName;
    if (typeof profilePhotoUrl === "string") updates.profile_photo_url = profilePhotoUrl;

    const { error: updateError } = await adminDb
      .from("users")
      .update(updates)
      .eq("id", uid);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}