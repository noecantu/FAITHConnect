import { adminDb } from "@/app/lib/supabase/admin";
import EditUserForm from "./EditUserForm";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;

  const { data: user } = await adminDb
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) {
    return <div className="p-6">User not found.</div>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Edit User</h1>
      <EditUserForm userId={userId} user={{ uid: user.id, ...user }} />
    </>
  );
}
