import MasterChurchDetailsClient from "./MasterChurchDetailsClient";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore();

export default async function MasterChurchDetailsPage({ params }: { params: { churchId: string } }) {
  const churchId = params.churchId;

  // 1. Load church document
  const churchSnap = await adminDb.collection("churches").doc(churchId).get();
  const church = churchSnap.exists ? { id: churchSnap.id, ...churchSnap.data() } : null;

  if (!church) {
    return <div className="p-6">Church not found.</div>;
  }

  // 2. Members count
  const membersSnap = await adminDb
    .collection("churches")
    .doc(churchId)
    .collection("members")
    .count()
    .get();

  const memberCount = membersSnap.data().count;

  // 3. Upcoming services
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const servicesSnap = await adminDb
    .collection("churches")
    .doc(churchId)
    .collection("servicePlans")
    .where("date", ">=", today.toISOString())
    .count()
    .get();

  const serviceCount = servicesSnap.data().count;

  // 4. Events this week
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const eventsSnap = await adminDb
    .collection("churches")
    .doc(churchId)
    .collection("events")
    .where("date", ">=", startOfWeek.toISOString())
    .where("date", "<=", endOfWeek.toISOString())
    .count()
    .get();

  const eventCount = eventsSnap.data().count;

  // 5. Admins
  const adminsSnap = await adminDb
    .collection("users")
    .where("churchId", "==", churchId)
    .where("roles", "array-contains", "Admin")
    .get();

  const admins = adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return (
    <MasterChurchDetailsClient
      church={church}
      memberCount={memberCount}
      serviceCount={serviceCount}
      eventCount={eventCount}
      admins={admins}
    />
  );
}
