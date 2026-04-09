"use client";

import { useRouter } from "next/navigation";
import { useChurchId } from "@/app/hooks/useChurchId";
import MemberForm from "@/app/components/members/MemberForm";
import { PageHeader } from "@/app/components/page-header";

export default function NewMemberPage() {
  const router = useRouter();
  const { churchId } = useChurchId();

  if (!churchId) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title="Add Member"
        subtitle="Create a new member profile."
      />

      <MemberForm
        churchId={churchId ?? ""}
        onSuccess={() => router.push(`/church/${churchId}/members`)}
      />
    </>
  );
}
