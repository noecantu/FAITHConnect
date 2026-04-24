import { redirect } from "next/navigation";

import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { normalizeFirestore } from "@/app/lib/normalize";
import { SYSTEM_ROLE_LIST, type Role } from "@/app/lib/auth/roles";
import EditAllUserForm, { type EditableNonSystemUser } from "./EditAllUserForm";

export default async function AllUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.roles?.includes("RootAdmin")) {
    redirect("/admin");
  }

  const { id: userId } = await params;

  const [userSnap, churchesSnap] = await Promise.all([
    adminDb.collection("users").doc(userId).get(),
    adminDb.collection("churches").select("name").get(),
  ]);

  if (!userSnap.exists) {
    return <div className="p-6">User not found.</div>;
  }

  const normalized = normalizeFirestore(userSnap.data()) as {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    roles?: Role[];
    churchId?: string | null;
  };

  const roles = Array.isArray(normalized.roles) ? normalized.roles : [];
  const isSystemUser = roles.some((role) => SYSTEM_ROLE_LIST.includes(role));

  if (isSystemUser) {
    return <div className="p-6">This tool only manages non-system users.</div>;
  }

  const user: EditableNonSystemUser = {
    uid: userSnap.id,
    email: normalized.email ?? "",
    firstName: normalized.firstName ?? "",
    lastName: normalized.lastName ?? "",
    roles,
    churchId: normalized.churchId ?? null,
  };

  const churches = churchesSnap.docs.map((doc) => {
    const data = doc.data() as { name?: unknown };
    const name = typeof data.name === "string" && data.name.trim().length > 0
      ? data.name
      : doc.id;

    return { id: doc.id, name };
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Edit User</h1>
      <EditAllUserForm user={user} churches={churches} />
    </>
  );
}