import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 1. Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    const inviterUid = decoded.uid;

    // 2. Fetch inviter's user profile
    const inviterSnap = await adminDb.collection("users").doc(inviterUid).get();
    const inviter = inviterSnap.data();

    if (!inviter) {
      return NextResponse.json(
        { error: "Inviter profile not found" },
        { status: 404 }
      );
    }

    const inviterRoles: string[] = inviter.roles || [];
    const inviterChurchId: string | null = inviter.churchId || null;

    // 3. Only Church Admins can invite members
    const isChurchAdmin =
      inviterRoles.includes("Admin") ||
      inviterRoles.includes("ChurchAdmin");

    if (!isChurchAdmin) {
      return NextResponse.json(
        { error: "Only Church Admins can invite members" },
        { status: 403 }
      );
    }

    if (!inviterChurchId) {
      return NextResponse.json(
        { error: "Inviter does not belong to a church" },
        { status: 400 }
      );
    }

    // 4. Check if a user already exists with this email
    let invitedUid: string | null = null;

    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      invitedUid = existingUser.uid;
    } catch {
      invitedUid = null; // User does not exist yet
    }

    // 5. If user does not exist, create a placeholder Firestore profile
    if (!invitedUid) {
      invitedUid = adminDb.collection("users").doc().id; // Generate a UID-like ID
    }

    // 6. Create or update Firestore user profile
    await adminDb.collection("users").doc(invitedUid).set(
      {
        id: invitedUid,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        roles: ["Member"], // Always Member for invites
        churchId: inviterChurchId,
        invitedAt: new Date(),
        status: "invited",
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, invitedUid });

  } catch (error) {
    console.error("Invite Member Error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
