export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;

  while (true) {
    const { data } = await adminDb
      .from("churches")
      .select("id")
      .eq("id", slug)
      .maybeSingle();

    if (!data) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
}

async function requireRootAdmin() {
  const authUser = await getServerUser();
  if (!authUser) return null;

  const { data: caller } = await adminDb
    .from("users")
    .select("roles")
    .eq("id", authUser.id)
    .single();

  const roles: string[] = Array.isArray(caller?.roles) ? caller.roles : [];
  if (!roles.includes("RootAdmin") && !roles.includes("SystemAdmin")) return null;
  return authUser;
}

// POST /api/admin/churches — create a church (and optionally an initial admin user)
export async function POST(req: Request) {
  try {
    const authUser = await requireRootAdmin();
    if (!authUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, timezone, address, logo_url, adminEmail } = body as Record<string, string | undefined>;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!timezone?.trim()) {
      return NextResponse.json({ error: "timezone is required" }, { status: 400 });
    }

    const baseSlug = slugify(name.trim());
    const slug = await generateUniqueSlug(baseSlug);

    const { data: church, error: churchError } = await adminDb
      .from("churches")
      .insert({
        id: slug,
        name: name.trim(),
        slug,
        timezone: timezone.trim(),
        address: address?.trim() || null,
        logo_url: logo_url?.trim() || null,
        created_at: new Date().toISOString(),
        created_by: authUser.id,
        settings: {},
      })
      .select("id, name, slug, timezone, address, logo_url, created_at")
      .single();

    if (churchError) throw churchError;

    // Optionally create initial admin user
    if (adminEmail?.trim()) {
      const inviteRes = await fetch(
        new URL("/api/church-users/create", req.url).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Forward the cookie header so the API can authenticate
            cookie: req.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({
            email: adminEmail.trim(),
            firstName: "",
            lastName: "",
            roles: ["Admin"],
            churchId: slug,
            sendInvite: true,
          }),
        }
      );

      if (!inviteRes.ok) {
        const inviteBody = await inviteRes.json().catch(() => ({}));
        // Church was created — return success but surface the invite warning
        return NextResponse.json(
          {
            church,
            warning: `Church created but invite failed: ${inviteBody.error ?? inviteRes.status}`,
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ church }, { status: 201 });
  } catch (err) {
    console.error("admin churches POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
