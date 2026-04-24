export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";

type ScopedContribution = {
  id: string;
  memberId?: string;
  memberName: string;
  amount: number;
  category: "Tithes" | "Offering" | "Donation" | "Other";
  contributionType: "Digital Transfer" | "Cash" | "Check" | "Other";
  date: string;
  notes?: string;
  churchId?: string;
  churchName?: string;
  regionId?: string;
  regionName?: string;
  districtId?: string;
  districtName?: string;
};

function getSessionCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return cookie
    .split("; ")
    .find((entry) => entry.startsWith("session="))
    ?.split("=")[1];
}

function normalizeDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in (value as Record<string, unknown>)
  ) {
    const seconds = Number((value as { seconds: unknown }).seconds);
    if (!Number.isNaN(seconds)) {
      return new Date(seconds * 1000).toISOString().slice(0, 10);
    }
  }

  return "";
}

export async function GET(req: Request) {
  try {
    const session = getSessionCookie(req);

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const callerUid = decoded.uid;

    const userSnap = await adminDb.collection("users").doc(callerUid).get();
    const user = userSnap.data();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const isRegionalAdmin = roles.includes("RegionalAdmin");
    const isDistrictAdmin = roles.includes("DistrictAdmin");

    if (!isRegionalAdmin && !isDistrictAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let districtId: string | null = null;
    let districtName: string | null = null;

    const regionById = new Map<string, { id: string; name: string }>();
    let churches: Array<{ id: string; name?: string | null; regionId?: string | null }> = [];

    if (isDistrictAdmin) {
      const userDistrictId = typeof user.districtId === "string" ? user.districtId.trim() : "";

      if (!userDistrictId) {
        return NextResponse.json({ error: "Missing district scope" }, { status: 400 });
      }

      districtId = userDistrictId;

      const districtSnap = await adminDb.collection("districts").doc(userDistrictId).get();
      districtName = districtSnap.exists
        ? ((districtSnap.data()?.name as string | undefined) ?? "Unknown District")
        : "Unknown District";

      const regionsSnap = await adminDb
        .collection("regions")
        .where("districtId", "==", userDistrictId)
        .get();

      const regionIds = regionsSnap.docs.map((doc) => doc.id);

      regionsSnap.docs.forEach((doc) => {
        regionById.set(doc.id, {
          id: doc.id,
          name: (doc.data().name as string | undefined) ?? "Unknown Region",
        });
      });

      const churchSnapshots = await Promise.all(
        regionIds.map((regionId) =>
          adminDb.collection("churches").where("regionId", "==", regionId).get()
        )
      );

      churches = churchSnapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => ({
          id: doc.id,
          name: (doc.data().name as string | undefined) ?? null,
          regionId: (doc.data().regionId as string | undefined) ?? null,
        }))
      );
    } else {
      const userRegionId = typeof user.regionId === "string" ? user.regionId.trim() : "";

      if (!userRegionId) {
        return NextResponse.json({ error: "Missing region scope" }, { status: 400 });
      }

      const regionSnap = await adminDb.collection("regions").doc(userRegionId).get();

      if (!regionSnap.exists) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      const regionData = regionSnap.data() ?? {};
      const regionName = (regionData.name as string | undefined) ?? "Unknown Region";
      regionById.set(userRegionId, { id: userRegionId, name: regionName });

      districtId = (regionData.districtId as string | undefined) ?? null;

      if (districtId) {
        const districtSnap = await adminDb.collection("districts").doc(districtId).get();
        districtName = districtSnap.exists
          ? ((districtSnap.data()?.name as string | undefined) ?? "Unknown District")
          : "Unknown District";
      }

      const churchesSnap = await adminDb
        .collection("churches")
        .where("regionId", "==", userRegionId)
        .get();

      churches = churchesSnap.docs.map((doc) => ({
        id: doc.id,
        name: (doc.data().name as string | undefined) ?? null,
        regionId: userRegionId,
      }));
    }

    if (churches.length === 0) {
      return NextResponse.json({ contributions: [] as ScopedContribution[] });
    }

    const contributionSnapshots = await Promise.all(
      churches.map((church) =>
        adminDb
          .collection("churches")
          .doc(church.id)
          .collection("contributions")
          .orderBy("date", "desc")
          .get()
          .then((snapshot) => ({ church, snapshot }))
      )
    );

    const contributions: ScopedContribution[] = [];

    contributionSnapshots.forEach(({ church, snapshot }) => {
      const region = church.regionId ? regionById.get(church.regionId) : undefined;

      snapshot.docs.forEach((doc) => {
        const raw = doc.data() as Record<string, unknown>;

        contributions.push({
          id: doc.id,
          memberId: typeof raw.memberId === "string" ? raw.memberId : undefined,
          memberName:
            typeof raw.memberName === "string" && raw.memberName.trim().length > 0
              ? raw.memberName
              : "Unknown Member",
          amount: typeof raw.amount === "number" ? raw.amount : 0,
          category:
            (raw.category as ScopedContribution["category"] | undefined) ?? "Other",
          contributionType:
            (raw.contributionType as ScopedContribution["contributionType"] | undefined) ??
            "Other",
          date: normalizeDate(raw.date),
          notes: typeof raw.notes === "string" ? raw.notes : "",
          churchId: church.id,
          churchName: church.name ?? "Unknown Church",
          regionId: church.regionId ?? undefined,
          regionName: region?.name ?? "Unknown Region",
          districtId: districtId ?? undefined,
          districtName: districtName ?? "Unknown District",
        });
      });
    });

    contributions.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error("reports contributions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
