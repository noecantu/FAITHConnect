export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";

const BUCKET = "member-photos";

async function bucketExists() {
  const { data: buckets, error: listError } = await getAdminClient().storage.listBuckets();
  if (listError) throw listError;
  return (buckets ?? []).some((bucket) => bucket.id === BUCKET);
}

export async function POST() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!(await bucketExists())) {
      return NextResponse.json({ success: true });
    }

    const objectPath = `users/${user.id}/profile.jpg`;

    const { error: deleteError } = await getAdminClient().storage
      .from(BUCKET)
      .remove([objectPath]);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("users/profile-photo/delete error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete profile photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
