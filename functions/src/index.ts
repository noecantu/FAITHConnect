/**
 * Firebase Functions entry point
 */

import { setGlobalOptions } from "firebase-functions/v2/options";
import { onCall } from "firebase-functions/v2/https";
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
// createMemberLogin (v2)
// -----------------------------
export const createMemberLogin = onCall(
  async (request) => {

    console.log("AUTH:", request.auth);
    console.log("DATA:", request.data);

    const { data, auth } = request;

    // 1. Ensure the caller is authenticated
    if (!auth) {
      throw new Error("Only authenticated admins can create logins.");
    }

    // 2. Extract and type the payload
    const { email, memberId, churchId } = data as CreateMemberLoginPayload;

    if (!email || !memberId || !churchId) {
      throw new Error("Missing required fields: email, memberId, churchId.");
    }

    try {
      // 3. Create the Firebase Auth user
      const userRecord = await admin.auth().createUser({ email });
      const uid = userRecord.uid;

      // 4. Write /users/{uid}
      await admin.firestore().collection("users").doc(uid).set({
        email,
        memberId,
        churchId,
        roles: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Link the Member to the User
      await admin
        .firestore()
        .collection("churches")
        .doc(churchId)
        .collection("members")
        .doc(memberId)
        .update({
          userId: uid,
        });

      // 6. Send password reset email
      await admin.auth().generatePasswordResetLink(email);

      return { uid };
    } catch (error: any) {
      console.error("Error creating member login:", error);
      throw new Error(error.message || "Failed to create login.");
    }
  }
);

export const sendPasswordReset = onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new Error("Missing userId");
  }

  const auth = admin.auth();

  // Lookup the user by UID
  const user = await auth.getUser(userId);

  if (!user.email) {
    throw new Error("User has no email");
  }

  // Send reset email
  await auth.generatePasswordResetLink(user.email);

  return { success: true };
});