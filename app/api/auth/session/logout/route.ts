import { NextResponse } from "next/server";

export async function POST() {
  // Create a response object
  const response = NextResponse.json({ status: "success" });

  // Clear the Firebase session cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 0, // expires immediately
  });

  return response;
}
