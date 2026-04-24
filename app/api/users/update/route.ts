//app/api/users/update/route.ts
import { NextResponse } from "next/server";
import { updateUserAction } from "@/app/(dashboard)/admin/actions/updateUserAction";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await updateUserAction(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
