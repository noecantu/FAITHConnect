// app/admin/users/[id]/page.tsx

import { adminDb } from "@/app/lib/firebase/admin";
import EditUserForm from "./EditUserForm";
import { normalizeFirestore } from "@/app/lib/normalize";
import { DashboardPage } from "@/app/(dashboard)/layout/DashboardPage";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;

  const snap = await adminDb.collection("users").doc(userId).get();

  if (!snap.exists) {
    return <div className="p-6">User not found.</div>;
  }

  const user = {
    id: snap.id,
    ...normalizeFirestore(snap.data()),
  };

  return (
    <DashboardPage>
      <h1 className="text-2xl font-bold">Edit User</h1>
      <EditUserForm userId={userId} user={user} />
    </DashboardPage>
  );
}
