import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { logSystemEvent } from "@/app/lib/system/logging";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      actorUid,
      actorName,
      roles,
      regionName,
      state,
      title,
      districtName,
      districtTitle,
      districtState,
    } = await req.json();

    // 1. Create Supabase Auth user via admin API
    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user.");
    }

    const userId = authData.user.id;
    let regionId = null;
    let districtId = null;

    // 2. If Regional Admin
    if (roles?.includes("RegionalAdmin") && regionName) {
      regionId = userId;
      const { error: regionError } = await adminDb
        .from("regions")
        .insert({
          id: regionId,
          name: regionName,
          state: state || null,
          admin_uid: userId,
          region_admin_name: `${firstName} ${lastName}`.trim(),
          region_admin_title: title || null,
          created_at: new Date().toISOString(),
        });

      if (regionError) throw regionError;
    }

    // 2b. If District Admin
    if (roles?.includes("DistrictAdmin") && districtName) {
      districtId = userId;
      const { error: districtError } = await adminDb
        .from("districts")
        .insert({
          id: districtId,
          name: districtName,
          admin_uid: userId,
          region_admin_name: `${firstName} ${lastName}`.trim(),
          region_admin_title: districtTitle || null,
          state: districtState || null,
          created_at: new Date().toISOString(),
        });

      if (districtError) throw districtError;
    }

    // 3. Create Supabase user profile
    // Use upsert because the on_auth_user_created trigger may have already
    // inserted a stub row (id, email) before we get here.
    const { error: userError } = await adminDb
      .from("users")
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
        email,
        roles: roles || [],
        region_id: regionId,
        region_name: regionName || null,
        region_admin_title: title || null,
        state: state || null,
        district_id: districtId,
        district_name: districtName || null,
        district_title: districtTitle || null,
        district_state: districtState || null,
        church_id: null,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (userError) throw userError;

    // 4. Update Auth user app_metadata (equivalent to custom claims)
    await adminDb.auth.admin.updateUserById(userId, {
      app_metadata: {
        roles,
        regionId,
        regionAdminTitle: title || null,
        districtId,
      },
    });

    // 5. Log system event
    await logSystemEvent({
      type: "SYSTEM_USER_CREATED",
      actorUid,
      actorName,
      targetId: userId,
      targetType: "SYSTEM_USER",
      message: `Created system-level user: ${email}`,
      metadata: {
        roles,
        regionId,
        regionName,
        regionAdminTitle: title || null,
        districtId,
        districtName: districtName || null,
      },
    });

    return NextResponse.json({
      success: true,
      userId,
      regionId,
      districtId,
    });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create system user." },
      { status: 400 }
    );
  }
}
