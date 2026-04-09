// app/(dashboard)/admin/settings/integrityActions.ts
"use server";

import { adminDb } from "@/app/lib/firebase/admin";
import { SystemUser } from "@/app/lib/types";

/**
 * Recursively converts Firestore data into JSON‑serializable values.
 * - Firestore Timestamp → ISO string
 * - Nested objects/arrays handled safely
 */
function serializeFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Firestore Timestamp (has .toDate())
  if (typeof obj === "object" && typeof obj.toDate === "function") {
    return obj.toDate().toISOString();
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(serializeFirestore);
  }

  // Plain object
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeFirestore(v)])
    );
  }

  // Primitive
  return obj;
}

/* ---------------------------------------------------------
   SCAN: Users whose churchId is missing or references a non‑existent church
--------------------------------------------------------- */
export async function scanForStrayUsers() {
  const usersSnap = await adminDb
    .collection("users")
    .select("roles", "churchId")
    .get();

  const churchesSnap = await adminDb.collection("churches").get();
  const churchIds = new Set(churchesSnap.docs.map(d => d.id));

  const stray = usersSnap.docs
    .filter(u => {
      const data = u.data();

      // Skip RootAdmin entirely
      if (data.roles?.includes("RootAdmin")) {
        return false;
      }

      // Stray if no churchId or invalid churchId
      return !data.churchId || !churchIds.has(data.churchId);
    })
    .map(u => ({
      id: u.id,
      ...serializeFirestore(u.data())
    }));

  return stray;
}

/* ---------------------------------------------------------
   SCAN: Members inside churches who have no userId
--------------------------------------------------------- */
export async function scanForOrphanedMembers() {
  const churchesSnap = await adminDb.collection("churches").get();

  // Build a set of active church IDs
  const activeChurchIds = new Set(
    churchesSnap.docs
      .filter(c => {
        const data = c.data();
        return data.status === "Active" || data.active === true || !data.status;
      })
      .map(c => c.id)
  );

  const orphaned: any[] = [];

  for (const church of churchesSnap.docs) {
    const membersSnap = await church.ref.collection("members").get();

    membersSnap.docs.forEach(m => {
      const churchId = church.id;

      // If the church is NOT active, all its members are orphaned
      if (!activeChurchIds.has(churchId)) {
        orphaned.push({
          churchId,
          memberId: m.id,
          ...serializeFirestore(m.data())
        });
      }
    });
  }

  return orphaned;
}

/* ---------------------------------------------------------
   SCAN: Churches that have zero Admin users
--------------------------------------------------------- */
export async function scanForChurchesWithoutAdmins() {
  const churchesSnap = await adminDb.collection("churches").get();
  const usersSnap = await adminDb
    .collection("users")
    .select("roles", "churchId")
    .get();

  const users = usersSnap.docs.map(d => ({
    id: d.id,
    ...serializeFirestore(d.data())
  })) as SystemUser[];

  const result = churchesSnap.docs
    .filter(church => {
      const churchId = church.id;
      const admins = users.filter(
        u => u.churchId === churchId && u.roles?.includes("Admin")
      );
      return admins.length === 0;
    })
    .map(church => ({
      id: church.id,
      ...serializeFirestore(church.data())
    }));

  return result;
}

/* ---------------------------------------------------------
   SCAN: Users with invalid roles
--------------------------------------------------------- */
export async function scanForInvalidRoles() {
  const VALID_ROLES = [
    "RootAdmin",
    "Admin",
    "AttendanceManager",
    "Caretaker",
    "CaretakerManager",
    "Deacon",
    "EventManager",
    "Finance",
    "MemberManager",
    "MensGroup",
    "MensGroupManager",
    "Minister",
    "MusicManager",
    "MusicMember",
    "Pastor",
    "ServiceManager",
    "Usher",
    "UsherManager",
    "WomensGroup",
    "WomensGroupManager",
    "YouthGroup",
    "YouthGroupManager"
  ];

  const usersSnap = await adminDb.collection("users").select("roles").get();

  const invalid = usersSnap.docs
    .filter(u => {
      const roles = u.data().roles || [];
      return roles.some((r: string) => !VALID_ROLES.includes(r));
    })
    .map(u => ({
      id: u.id,
      ...serializeFirestore(u.data())
    }));

  return invalid;
}
