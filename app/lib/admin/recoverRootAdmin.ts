import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Ensure Firebase Admin is initialized once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const ROOT_EMAIL = "root@faithconnect.app";
const ROOT_CHURCH_ID = "system";

export async function recoverRootAdmin() {
  const auth = getAuth();
  const db = getFirestore();

  let user;

  // 1. Ensure the Auth user exists
  try {
    user = await auth.getUserByEmail(ROOT_EMAIL);
  } catch {
    user = await auth.createUser({
      email: ROOT_EMAIL,
      password: "TempRoot123!",
      emailVerified: true,
    });
  }

  // 2. Ensure custom claims
  await auth.setCustomUserClaims(user.uid, {
    roles: ["RootAdmin"],
    churchId: ROOT_CHURCH_ID,
  });

  // 3. Ensure Firestore user doc
  await db.collection("users").doc(user.uid).set(
    {
      email: ROOT_EMAIL,
      roles: ["RootAdmin"],
      churchId: ROOT_CHURCH_ID,
      firstName: "Root",
      lastName: "Admin",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { merge: true }
  );

  // 4. Generate login/reset link
  const resetLink = await auth.generatePasswordResetLink(ROOT_EMAIL);

  return {
    uid: user.uid,
    email: ROOT_EMAIL,
    resetLink,
  };
}
