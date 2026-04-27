export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, getAdminClient } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET = "logos";

function getSafeExtension(fileName: string): string {
  const parts = fileName.split(".");
  const candidate = parts.length > 1 ? parts[parts.length - 1] : "png";
  return candidate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Load user profile for roles/districtId
    const { data: profile } = await adminDb
      .from("users")
      .select("roles, district_id")
      .eq("id", user.id)
      .single();

    const roles = profile?.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageDistrict = can(roles, "district.manage");

    if (!canManageSystem && !canManageDistrict) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await req.formData();
    const districtId = formData.get("districtId");
    const file = formData.get("file");

    if (typeof districtId !== "string" || districtId.trim().length === 0) {
      return NextResponse.json({ error: "Missing districtId." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json({ error: "Logo must be 5MB or smaller." }, { status: 400 });
    }

    if (!canManageSystem && profile?.district_id !== districtId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: district } = await adminDb
      .from("districts")
      .select("id")
      .eq("id", districtId)
      .single();

    if (!district) {
      return NextResponse.json({ error: "District not found." }, { status: 404 });
    }

    const ext = getSafeExtension(file.name);
    const objectPath = `districts/${districtId}/logo/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await getAdminClient().storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = getAdminClient().storage
      .from(BUCKET)
      .getPublicUrl(objectPath);

    return NextResponse.json({ url: urlData.publicUrl, path: objectPath });
  } catch (error) {
    console.error("district/logo/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
