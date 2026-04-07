import { NextResponse } from "next/server";
import { updateUserAction } from "@/app/(dashboard)/admin/actions/updateUserAction";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await updateUserAction(body);
  return NextResponse.json(result);
}
