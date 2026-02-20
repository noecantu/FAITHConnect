import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();

  const { firstName, lastName, profilePhotoUrl } = body;

  const uid = req.headers.get("x-user-id");
  if (!uid) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await adminDb.collection("users").doc(uid).update({
    firstName,
    lastName,
    profilePhotoUrl,
  });

  return NextResponse.json({ success: true });
}
