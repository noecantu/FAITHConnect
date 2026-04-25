export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

    // Load user profile for roles/regionId
    const { data: profile } = await adminDb
      .from("users")
      .select("roles, region_id")
      .eq("id", user.id)
      .single();

    const roles = profile?.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageRegion = can(roles, "region.manage");

    if (!canManageSystem && !canManageRegion) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await req.formData();
    const regionId = formData.get("regionId");
    const file = formData.get("file");

    if (typeof regionId !== "string" || regionId.trim().length === 0) {
      return NextResponse.json({ error: "Missing regionId." }, { status: 400 });
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

    if (!canManageSystem && profile?.region_id !== regionId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: region } = await adminDb
      .from("regions")
      .select("id")
      .eq("id", regionId)
      .single();

    if (!region) {
      return NextResponse.json({ error: "Region not found." }, { status: 404 });
    }

    const ext = getSafeExtension(file.name);
    const objectPath = `regions/${regionId}/logo/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(objectPath);

    return NextResponse.json({ url: urlData.publicUrl, path: objectPath });
  } catch (error) {
    console.error("region/logo/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
