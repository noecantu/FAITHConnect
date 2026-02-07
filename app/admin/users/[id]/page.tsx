// app/admin/users/[id]/page.tsx

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import EditUserForm from "./EditUserForm";
import { normalizeFirestore } from "@/lib/normalize";

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
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Edit User</h1>
      <EditUserForm userId={userId} user={user} />
    </div>
  );
}
