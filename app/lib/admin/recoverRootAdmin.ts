import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const ROOT_EMAIL = "root@faithconnect.app";
const ROOT_CHURCH_ID = "system";

export async function recoverRootAdmin() {
  // Initialize lazily — only when the function is called
  const app = getAdminApp();

  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;

  try {
    user = await auth.getUserByEmail(ROOT_EMAIL);
  } catch {
    user = await auth.createUser({
      email: ROOT_EMAIL,
      password: "TempRoot123!",
      emailVerified: true,
    });
  }

  await auth.setCustomUserClaims(user.uid, {
    roles: ["RootAdmin"],
    churchId: ROOT_CHURCH_ID,
  });

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
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

  const resetLink = await auth.generatePasswordResetLink(ROOT_EMAIL);

  return {
    uid: user.uid,
    email: ROOT_EMAIL,
    resetLink,
  };
}
