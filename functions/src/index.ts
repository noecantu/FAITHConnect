/**
 * Firebase Functions entry point
 */

import { setGlobalOptions } from "firebase-functions/v2/options";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();

// -----------------------------
// Types
// -----------------------------
interface CreateMemberLoginPayload {
  email: string;
  memberId: string;
  churchId: string;
}

// -----------------------------
// Helpers
// -----------------------------
async function sendPasswordSetupEmail(email: string, resetLink: string) {
  // TODO: Replace with your real email provider
  console.log(`Password setup link for ${email}: ${resetLink}`);
}

// -----------------------------
// createMemberLogin
// -----------------------------
export const createMemberLogin = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated admins can create logins."
    );
  }

  const { email, memberId, churchId } = data as CreateMemberLoginPayload;

  if (!email || !memberId || !churchId) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, memberId, churchId."
    );
  }

  try {
    // 1. Create Firebase Auth user with a temporary password
    const userRecord = await admin.auth().createUser({
      email,
      password: Math.random().toString(36).slice(-10),
    });

    const uid = userRecord.uid;

    // 2. Create Firestore user document
    await admin.firestore().collection("users").doc(uid).set({
      email,
      memberId,
      churchId,
      roles: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Link Member → User
    await admin
      .firestore()
      .collection("churches")
      .doc(churchId)
      .collection("members")
      .doc(memberId)
      .update({ userId: uid });

    // 4. Generate password reset link
    const actionCodeSettings = {
      url: "https://faith-connect-7342d.web.app",
      handleCodeInApp: false,
    };

    const resetLink = await admin
      .auth()
      .generatePasswordResetLink(email, actionCodeSettings);

    // 5. Send email
    await sendPasswordSetupEmail(email, resetLink);

    return {
      uid,
      message: "User created and password setup email sent.",
    };
  } catch (error: any) {
    console.error("Error creating member login:", error);
    throw new HttpsError("internal", error.message || "Failed to create login.");
  }
});

// -----------------------------
// sendPasswordReset
// -----------------------------
export const sendPasswordReset = onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "Missing userId");
  }

  try {
    const user = await admin.auth().getUser(userId);

    if (!user.email) {
      throw new HttpsError("not-found", "User has no email address.");
    }

    // You may want to actually send a reset email here
    // but your original function did not, so I kept it consistent.

    return { success: true };
  } catch (error: any) {
    console.error("Error sending password reset:", error);
    throw new HttpsError("internal", error.message || "Failed to send reset.");
  }
});

// -----------------------------
// deleteUserByEmail
// -----------------------------
export const deleteUserByEmail = onCall(async (request) => {
  const { email } = request.data;

  if (!email) {
    throw new HttpsError("invalid-argument", "Email is required");
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);

    return { success: true };
  } catch (error: any) {
    console.error("deleteUserByEmail error:", error);
    throw new HttpsError("internal", error.message || "Failed to delete user");
  }
});

// -----------------------------
// deleteUserByUid
// -----------------------------
export const deleteUserByUid = onCall(async (request) => {
  console.log("deleteUserByUid request:", request.data);

  const { uid } = request.data;

  if (!uid) {
    console.error("deleteUserByUid missing UID");
    throw new HttpsError("invalid-argument", "UID is required");
  }

  try {
    console.log("Deleting user:", uid);
    await admin.auth().deleteUser(uid);
    console.log("Deleted user:", uid);
    return { success: true };
  } catch (error: any) {
    console.error("deleteUserByUid error:", error);
    throw new HttpsError("internal", error.message || "Failed to delete user");
  }
});

export const getFirestoreUsage = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

    const end = new Date().toISOString();
    const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const url =
      `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
      "?filter=metric.type='firestore.googleapis.com/database/disk/usage'" +
      `&interval.endTime=${end}` +
      `&interval.startTime=${start}`;

    const token = await getAccessToken();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const usageBytes =
      data.timeSeries?.[0]?.points?.[0]?.value?.int64Value ?? null;

    res.json({ usageBytes });
  } catch (err) {
    console.error("Error fetching Firestore usage:", err);
    res.status(500).json({ error: "Failed to fetch Firestore usage" });
  }
});

async function getAccessToken() {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}