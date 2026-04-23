export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import type { DocumentReference } from "firebase-admin/firestore";

function readSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  return match?.[1] ?? null;
}

async function deleteDocumentTree(ref: DocumentReference) {
  const subcollections = await ref.listCollections();

  for (const subcollection of subcollections) {
    const childRefs = await subcollection.listDocuments();

    for (const childRef of childRefs) {
      await deleteDocumentTree(childRef);
    }
  }

  await ref.delete();
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const sessionCookie = readSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const actorUid = decoded.uid;

    if (actorUid === uid) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const actorSnap = await adminDb.collection("users").doc(actorUid).get();
    if (!actorSnap.exists) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actor = actorSnap.data() as { roles?: unknown; churchId?: unknown };
    const actorRoles = (Array.isArray(actor.roles) ? actor.roles : []) as Role[];
    const actorChurchId = typeof actor.churchId === "string" ? actor.churchId : null;
    const canManageSystem = can(actorRoles, "system.manage");
    const canManageChurch = can(actorRoles, "church.manage");

    if (!canManageSystem && !canManageChurch) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const targetRef = adminDb.collection("users").doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const target = targetSnap.data() as { churchId?: unknown };
    const targetChurchId = typeof target.churchId === "string" ? target.churchId : null;

    if (!canManageSystem) {
      if (!actorChurchId || !targetChurchId || actorChurchId !== targetChurchId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    if (targetChurchId) {
      const churchSnap = await adminDb.collection("churches").doc(targetChurchId).get();
      if (churchSnap.exists) {
        const church = churchSnap.data() as {
          billingOwnerUid?: unknown;
          createdBy?: unknown;
        };

        const billingOwnerUid =
          typeof church.billingOwnerUid === "string"
            ? church.billingOwnerUid
            : typeof church.createdBy === "string"
            ? church.createdBy
            : null;

        if (billingOwnerUid === uid) {
          return NextResponse.json(
            {
              error:
                "This user is the billing owner for this church. Reassign billing ownership before deleting this account.",
            },
            { status: 409 }
          );
        }
      }
    }

    try {
      await adminAuth.deleteUser(uid);
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";

      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    await deleteDocumentTree(targetRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("church-users/delete error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
