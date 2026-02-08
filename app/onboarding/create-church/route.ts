import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { uid, churchName } = await req.json();

    if (!uid || !churchName) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 1. Create church document
    const churchId = crypto.randomUUID();
    const churchRef = doc(db, "churches", churchId);

    await setDoc(churchRef, {
      name: churchName,
      createdAt: serverTimestamp(),
      createdBy: uid,
      settings: {
        featureFlags: {},
        platformHealth: {},
      },
    });

    // 2. Update user document
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        churchId,
        role: "admin",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Create membership record
    const memberRef = doc(db, `churches/${churchId}/members`, uid);
    await setDoc(memberRef, {
      role: "admin",
      joinedAt: serverTimestamp(),
    });

    return NextResponse.json({ churchId });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church." },
      { status: 500 }
    );
  }
}
