export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";

const BUCKET = "member-photos";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type UploadKind = "profile" | "qr";

async function ensureBucketExists() {
  const admin = getAdminClient();
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw listError;

  const exists = (buckets ?? []).some((bucket) => bucket.id === BUCKET);
  if (exists) return;

  const { error: createError } = await admin.storage.createBucket(BUCKET, {
    public: true,
  });

  if (createError) throw createError;
}

function isAllowedCaller(params: {
  roles: string[];
  callerChurchId: string | null;
  managedChurchIds: string[];
  targetChurchId: string;
}) {
  const { roles, callerChurchId, managedChurchIds, targetChurchId } = params;

  if (callerChurchId === targetChurchId) return true;
  if (managedChurchIds.includes(targetChurchId)) return true;

  return (
    roles.includes("RootAdmin") ||
    roles.includes("SystemAdmin") ||
    roles.includes("DistrictAdmin") ||
    roles.includes("RegionalAdmin")
  );
}

function parseKind(value: FormDataEntryValue | null): UploadKind | null {
  if (value !== "profile" && value !== "qr") return null;
  return value;
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const churchId = formData.get("churchId");
    const memberId = formData.get("memberId");
    const kind = parseKind(formData.get("kind"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (typeof churchId !== "string" || !churchId) {
      return NextResponse.json({ error: "Missing churchId." }, { status: 400 });
    }

    if (typeof memberId !== "string" || !memberId) {
      return NextResponse.json({ error: "Missing memberId." }, { status: 400 });
    }

    if (!kind) {
      return NextResponse.json({ error: "Missing or invalid kind." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be 5MB or smaller." }, { status: 400 });
    }

    const { data: caller, error: callerError } = await getAdminClient()
      .from("users")
      .select("roles, church_id, managed_church_ids")
      .eq("id", user.id)
      .single();

    if (callerError || !caller) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const roles = Array.isArray(caller.roles) ? caller.roles : [];
    const managedChurchIds = Array.isArray(caller.managed_church_ids)
      ? caller.managed_church_ids
      : [];

    if (
      !isAllowedCaller({
        roles,
        callerChurchId: caller.church_id ?? null,
        managedChurchIds,
        targetChurchId: churchId,
      })
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await ensureBucketExists();

    const fileName = kind === "profile" ? "profile.jpg" : "qr.png";
    const objectPath = `churches/${churchId}/members/${memberId}/${fileName}`;
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

    return NextResponse.json({ url: `${urlData.publicUrl}?t=${Date.now()}` });
  } catch (error) {
    console.error("members/media/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload member media.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
