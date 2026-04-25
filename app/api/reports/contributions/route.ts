export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

type ScopedContribution = {
  id: string;
  memberId?: string;
  memberName: string;
  amount: number;
  category: "Tithes" | "Offering" | "Donation" | "Other";
  contributionType: "Digital Transfer" | "Cash" | "Check" | "Other";
  date: string;
  notes?: string;
  church_id?: string;
  churchName?: string;
  regionId?: string;
  regionName?: string;
  districtId?: string;
  districtName?: string;
};

export async function GET() {
  try {
    const caller = await getServerUser();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await adminDb.from("users").select("*").eq("id", caller.id).single();
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
    let churches: Array<{ id: string; name?: string | null; region_id?: string | null }> = [];

    if (isDistrictAdmin) {
      const userDistrictId = typeof user.district_id === "string" ? user.district_id.trim() : "";
      if (!userDistrictId) {
        return NextResponse.json({ error: "Missing district scope" }, { status: 400 });
      }

      districtId = userDistrictId;

      const { data: districtData } = await adminDb.from("districts").select("name").eq("id", userDistrictId).single();
      districtName = districtData?.name ?? "Unknown District";

      const { data: regionsData } = await adminDb.from("regions").select("id, name").eq("district_id", userDistrictId);
      const regionIds: string[] = [];
      (regionsData ?? []).forEach((r) => {
        regionIds.push(r.id);
        regionById.set(r.id, { id: r.id, name: r.name ?? "Unknown Region" });
      });

      if (regionIds.length > 0) {
        const { data: churchesData } = await adminDb.from("churches").select("id, name, region_id").in("region_id", regionIds);
        churches = churchesData ?? [];
      }
    } else {
      const userRegionId = typeof user.region_id === "string" ? user.region_id.trim() : "";
      if (!userRegionId) {
        return NextResponse.json({ error: "Missing region scope" }, { status: 400 });
      }

      const { data: regionData } = await adminDb.from("regions").select("id, name, district_id").eq("id", userRegionId).single();
      if (!regionData) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      regionById.set(userRegionId, { id: userRegionId, name: regionData.name ?? "Unknown Region" });
      districtId = regionData.district_id ?? null;

      if (districtId) {
        const { data: districtData } = await adminDb.from("districts").select("name").eq("id", districtId).single();
        districtName = districtData?.name ?? "Unknown District";
      }

      const { data: churchesData } = await adminDb.from("churches").select("id, name, region_id").eq("region_id", userRegionId);
      churches = churchesData ?? [];
    }

    if (churches.length === 0) {
      return NextResponse.json({ contributions: [] as ScopedContribution[] });
    }

    const churchIds = churches.map((c) => c.id);
    const { data: rawContributions } = await adminDb
      .from("contributions")
      .select("*")
      .in("church_id", churchIds)
      .order("date", { ascending: false });

    const churchById = new Map(churches.map((c) => [c.id, c]));

    const contributions: ScopedContribution[] = (rawContributions ?? []).map((raw) => {
      const church = churchById.get(raw.church_id) ?? null;
      const region = church?.region_id ? regionById.get(church.region_id) : undefined;

      return {
        id: raw.id,
        memberId: raw.member_id ?? undefined,
        memberName: raw.member_name ?? "Unknown Member",
        amount: typeof raw.amount === "number" ? raw.amount : 0,
        category: raw.category ?? "Other",
        contributionType: raw.contribution_type ?? "Other",
        date: raw.date ?? "",
        notes: raw.notes ?? "",
        church_id: raw.church_id,
        churchName: church?.name ?? "Unknown Church",
        regionId: church?.region_id ?? undefined,
        regionName: region?.name ?? "Unknown Region",
        districtId: districtId ?? undefined,
        districtName: districtName ?? "Unknown District",
      };
    });

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error("reports contributions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type ScopedContribution = {
  id: string;
  memberId?: string;
  memberName: string;
  amount: number;
  category: "Tithes" | "Offering" | "Donation" | "Other";
  contributionType: "Digital Transfer" | "Cash" | "Check" | "Other";
  date: string;
  notes?: string;
  church_id?: string;
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
    

    const userSnap = await adminDb.from("users").select("*").eq("id", callerUid).single();
    const user = userSnap;

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

      const districtSnap = await adminDb.from("districts").select("*").eq("id", userDistrictId).single();
      districtName = districtSnap !== null
        ? ((districtSnap?.name as string | undefined) ?? "Unknown District")
        : "Unknown District";

      const regionsSnap = await adminDb
        .collection("regions")
        .where("districtId", "==", userDistrictId)
        .get();

      const regionIds = regionsSnap.docs.map((doc) => doc.id);

      regionsSnap.docs.forEach((doc) => {
        regionById.set(doc.id, {
          id: doc.id,
          name: (doc.name as string | undefined) ?? "Unknown Region",
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
          name: (doc.name as string | undefined) ?? null,
          regionId: (doc.regionId as string | undefined) ?? null,
        }))
      );
    } else {
      const userRegionId = typeof user.regionId === "string" ? user.regionId.trim() : "";

      if (!userRegionId) {
        return NextResponse.json({ error: "Missing region scope" }, { status: 400 });
      }

      const regionSnap = await adminDb.from("regions").select("*").eq("id", userRegionId).single();

      if (!regionSnap !== null) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      const regionData = regionSnap ?? {};
      const regionName = (regionData.name as string | undefined) ?? "Unknown Region";
      regionById.set(userRegionId, { id: userRegionId, name: regionName });

      districtId = (regionData.districtId as string | undefined) ?? null;

      if (districtId) {
        const districtSnap = await adminDb.from("districts").select("*").eq("id", districtId).single();
        districtName = districtSnap !== null
          ? ((districtSnap?.name as string | undefined) ?? "Unknown District")
          : "Unknown District";
      }

      const churchesSnap = await adminDb
        .collection("churches")
        .where("regionId", "==", userRegionId)
        .get();

      churches = churchesSnap.docs.map((doc) => ({
        id: doc.id,
        name: (doc.name as string | undefined) ?? null,
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
        const raw = doc as Record<string, unknown>;

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
          church_id: church.id,
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
