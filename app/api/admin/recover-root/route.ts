//app/api/admin/recover-root/route.ts
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { recoverRootAdmin } from "@/app/lib/admin/recoverRootAdmin";

export async function GET() {
  const result = await recoverRootAdmin();
  return NextResponse.json(result);
}
