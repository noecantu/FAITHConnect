/**
 * Firebase Functions entry point
 */

import { setGlobalOptions } from "firebase-functions/v2/options";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();

// -----------------------------
// Types
// -----------------------------
type CreateMemberLoginPayload = {
  email: string;
  memberId: string;
  churchId: string;
};

// -----------------------------
// Helpers
// -----------------------------
async function sendPasswordSetupEmail(email: string, resetLink: string) {
  // TODO: Replace with your email provider (Nodemailer, Mailgun, Resend, etc.)
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

    // 5. Send email (provider‑agnostic)
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

    const resetLink = await admin.auth().generatePasswordResetLink(user.email);

    // You can optionally email the link here using the same helper
    // await sendPasswordSetupEmail(user.email, resetLink);

    return { success: true };
  } catch (error: any) {
    console.error("Error sending password reset:", error);
    throw new HttpsError("internal", error.message || "Failed to send reset.");
  }
});
