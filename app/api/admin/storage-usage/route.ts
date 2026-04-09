export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase/admin";

export async function GET() {
  try {
    // Firestore does not expose DB size directly.
    // So we estimate by summing the serialized size of all documents.
    let totalBytes = 0;

    const collections = await adminDb.listCollections();

    for (const col of collections) {
      const snapshot = await col.get();

      snapshot.docs.forEach((doc) => {
        const json = JSON.stringify(doc.data());
        totalBytes += Buffer.byteLength(json, "utf8");
      });
    }

    return NextResponse.json({ storageUsed: totalBytes });
  } catch (err) {
    console.error("Storage usage error:", err);
    return NextResponse.json({ storageUsed: null }, { status: 500 });
  }
}
