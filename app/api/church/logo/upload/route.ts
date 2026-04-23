export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function getSafeExtension(fileName: string): string {
  const parts = fileName.split(".");
  const candidate = parts.length > 1 ? parts[parts.length - 1] : "png";
  return candidate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
}

function normalizeBucketName(bucket?: string): string | null {
  if (!bucket) return null;
  const normalized = bucket.replace(/^gs:\/\//, "").trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveBucketCandidates(): string[] {
  const candidates: string[] = [
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ]
    .map((value) => normalizeBucketName(value))
    .filter((value): value is string => Boolean(value));

  const expandedCandidates = new Set<string>();

  for (const candidate of candidates) {
    expandedCandidates.add(candidate);

    if (candidate.endsWith(".appspot.com")) {
      expandedCandidates.add(candidate.replace(".appspot.com", ".firebasestorage.app"));
    }

    if (candidate.endsWith(".firebasestorage.app")) {
      expandedCandidates.add(candidate.replace(".firebasestorage.app", ".appspot.com"));
    }
  }

  for (const candidate of candidates) {
    expandedCandidates.add(candidate);
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId) {
    expandedCandidates.add(`${projectId}.appspot.com`);
    expandedCandidates.add(`${projectId}.firebasestorage.app`);
  }

  return Array.from(expandedCandidates);
}

function isBucketMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("bucket") && message.includes("does not exist");
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const roles = user.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageChurch = can(roles, "church.manage");

    if (!canManageSystem && !canManageChurch) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await req.formData();
    const churchId = formData.get("churchId");
    const file = formData.get("file");

    if (typeof churchId !== "string" || churchId.trim().length === 0) {
      return NextResponse.json({ error: "Missing churchId." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json({ error: "Logo must be 5MB or smaller." }, { status: 400 });
    }

    if (!canManageSystem && user.churchId !== churchId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const churchSnap = await adminDb.collection("churches").doc(churchId).get();
    if (!churchSnap.exists) {
      return NextResponse.json({ error: "Church not found." }, { status: 404 });
    }

    const bucketCandidates = resolveBucketCandidates();
    if (bucketCandidates.length === 0) {
      return NextResponse.json(
        { error: "Storage bucket is not configured on the server." },
        { status: 500 }
      );
    }

    const ext = getSafeExtension(file.name);
    const objectPath = `churches/${churchId}/logo/logo-${Date.now()}.${ext}`;
    const token = crypto.randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    let successfulBucketName: string | null = null;

    for (const bucketName of bucketCandidates) {
      try {
        const bucket = getStorage().bucket(bucketName);
        const object = bucket.file(objectPath);

        await object.save(buffer, {
          resumable: false,
          contentType: file.type,
          metadata: {
            contentType: file.type,
            metadata: {
              firebaseStorageDownloadTokens: token,
            },
          },
        });

        successfulBucketName = bucket.name;
        break;
      } catch (error) {
        if (isBucketMissingError(error)) {
          continue;
        }

        throw error;
      }
    }

    if (!successfulBucketName) {
      return NextResponse.json(
        {
          error:
            "No configured storage bucket exists. Set FIREBASE_STORAGE_BUCKET to a valid bucket name.",
        },
        { status: 500 }
      );
    }

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${successfulBucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

    return NextResponse.json({ url: downloadUrl, path: objectPath });
  } catch (error) {
    console.error("church/logo/upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
