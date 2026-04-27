export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";

const BUCKET = "member-photos";
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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

export async function POST(req: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json({ error: "Profile photo must be 5MB or smaller." }, { status: 400 });
    }

    await ensureBucketExists();

    const objectPath = `users/${user.id}/profile.jpg`;
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
    console.error("users/profile-photo/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload profile photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
