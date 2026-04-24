export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";

type DistrictUser = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  churchId?: string | null;
  churchName?: string;
};

function getSessionCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return cookie
    .split("; ")
    .find((entry) => entry.startsWith("session="))
    ?.split("=")[1];
}

export async function GET(req: Request) {
  try {
    const session = getSessionCookie(req);

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const callerUid = decoded.uid;
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId")?.trim() ?? "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId" }, { status: 400 });
    }

    const userSnap = await adminDb.collection("users").doc(callerUid).get();
    const caller = userSnap.data();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = Array.isArray(caller.roles) ? caller.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("DistrictAdmin") || caller.districtId !== districtId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const regionsSnap = await adminDb
      .collection("regions")
      .where("districtId", "==", districtId)
      .get();

    const regionIds = regionsSnap.docs.map((doc) => doc.id);

    if (regionIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const churchSnapshots = await Promise.all(
      regionIds.map((regionId) => adminDb.collection("churches").where("regionId", "==", regionId).get())
    );

    const churches = churchSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name || doc.id }))
    );

    if (churches.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const churchNameById = new Map(churches.map((church) => [church.id, church.name]));

    const userSnapshots = await Promise.all(
      churches.map((church) => adminDb.collection("users").where("churchId", "==", church.id).get())
    );

    const users = new Map<string, DistrictUser>();

    userSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const churchId = typeof data.churchId === "string" ? data.churchId : null;

        users.set(doc.id, {
          uid: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roles: Array.isArray(data.roles) ? data.roles : [],
          churchId,
          churchName: churchId ? churchNameById.get(churchId) ?? churchId : undefined,
        });
      });
    });

    return NextResponse.json({ users: Array.from(users.values()) });
  } catch (error) {
    console.error("district users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}