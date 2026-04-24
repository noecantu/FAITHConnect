export const runtime = "nodejs";

import { NextResponse } from "next/server";
import admin from "firebase-admin";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import { can } from "@/app/lib/auth/permissions";
import { SYSTEM_ROLE_LIST, type Role } from "@/app/lib/auth/roles";

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

function readEntityName(data: Record<string, unknown> | undefined, fallback: string) {
  if (!data) return fallback;

  const name = data.name;
  return typeof name === "string" && name.trim().length > 0 ? name : fallback;
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
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const actorSnap = await adminDb.collection("users").doc(actorUid).get();
    if (!actorSnap.exists) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actor = actorSnap.data() as { roles?: unknown };
    const actorRoles = (Array.isArray(actor.roles) ? actor.roles : []) as Role[];

    if (!can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userSnap.data() as {
      roles?: unknown;
      regionId?: unknown;
      districtId?: unknown;
    };

    const targetRoles = (Array.isArray(userData.roles) ? userData.roles : []) as Role[];
    const isSystemUser = targetRoles.some((role) => SYSTEM_ROLE_LIST.includes(role));

    if (!isSystemUser) {
      return NextResponse.json({ error: "This endpoint only deletes system users." }, { status: 400 });
    }

    const regionId = typeof userData.regionId === "string" ? userData.regionId : null;
    const districtId = typeof userData.districtId === "string" ? userData.districtId : null;

    if (regionId) {
      const [churchesSnap, pendingChurchesSnap, regionSnap] = await Promise.all([
        adminDb.collection("churches").where("regionId", "==", regionId).limit(1).get(),
        adminDb.collection("churches").where("regionSelectedId", "==", regionId).limit(1).get(),
        adminDb.collection("regions").doc(regionId).get(),
      ]);

      const assignedChurch = churchesSnap.empty
        ? null
        : readEntityName(churchesSnap.docs[0].data() as Record<string, unknown>, churchesSnap.docs[0].id);
      const pendingChurch = pendingChurchesSnap.empty
        ? null
        : readEntityName(pendingChurchesSnap.docs[0].data() as Record<string, unknown>, pendingChurchesSnap.docs[0].id);

      if (assignedChurch || pendingChurch) {
        const blocker = assignedChurch
          ? `assigned church \"${assignedChurch}\"`
          : `pending church request \"${pendingChurch}\"`;

        return NextResponse.json(
          { error: `This regional leader cannot be deleted yet because of ${blocker}. Reassign or clear that church relationship first.` },
          { status: 409 }
        );
      }

      if (regionSnap.exists) {
        const regionData = regionSnap.data() as { districtId?: unknown };
        const parentDistrictId = typeof regionData.districtId === "string" ? regionData.districtId : null;

        if (parentDistrictId) {
          await adminDb.collection("districts").doc(parentDistrictId).update({
            regionIds: admin.firestore.FieldValue.arrayRemove(regionId),
          });
        }

        await deleteDocumentTree(regionSnap.ref);
      }
    }

    if (districtId) {
      const [approvedRegionsSnap, pendingRegionsSnap, districtSnap] = await Promise.all([
        adminDb.collection("regions").where("districtId", "==", districtId).limit(1).get(),
        adminDb.collection("regions").where("districtSelectedId", "==", districtId).limit(1).get(),
        adminDb.collection("districts").doc(districtId).get(),
      ]);

      const approvedRegion = approvedRegionsSnap.empty
        ? null
        : readEntityName(approvedRegionsSnap.docs[0].data() as Record<string, unknown>, approvedRegionsSnap.docs[0].id);
      const pendingRegion = pendingRegionsSnap.empty
        ? null
        : readEntityName(pendingRegionsSnap.docs[0].data() as Record<string, unknown>, pendingRegionsSnap.docs[0].id);

      if (approvedRegion || pendingRegion) {
        const blocker = approvedRegion
          ? `assigned region \"${approvedRegion}\"`
          : `pending region request \"${pendingRegion}\"`;

        return NextResponse.json(
          { error: `This district leader cannot be deleted yet because of ${blocker}. Reassign or clear that region relationship first.` },
          { status: 409 }
        );
      }

      if (districtSnap.exists) {
        await deleteDocumentTree(districtSnap.ref);
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

    await deleteDocumentTree(userRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("system-users/delete error:", error);
    return NextResponse.json({ error: "Failed to delete system user." }, { status: 500 });
  }
}