"use client";

import { useRouter } from "next/navigation";
import { useChurchId } from "@/app/hooks/useChurchId";
import MemberForm from "@/app/components/members/MemberForm";

export default function NewMemberPage() {
  const router = useRouter();
  const { churchId } = useChurchId();

  if (!churchId) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Member</h1>

      <MemberForm
        churchId={churchId ?? ""}
        onSuccess={() => {
          router.push(`/church/${churchId}/members`);
        }}
      />
    </div>
  );
}
