"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useChurchId } from "@/app/hooks/useChurchId";
import MemberForm from "@/app/components/members/MemberForm";
import type { Member } from "@/app/lib/types";

export default function EditMemberPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const { church_id } = useChurchId();

  const memberId = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Load member data
  useEffect(() => {
    if (!church_id || !memberId) return;

    async function loadMember() {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("church_id", church_id)
        .eq("id", memberId)
        .single();

      if (data) {
        setMember({
          id: data.id,
          userId: data.user_id ?? null,
          checkInCode: data.check_in_code ?? "",
          qrCode: data.qr_code ?? "",
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? "",
          phoneNumber: data.phone_number ?? "",
          profilePhotoUrl: data.profile_photo_url ?? "",
          status: data.status ?? "Active",
          address: data.address ?? null,
          birthday: data.birthday ?? "",
          baptismDate: data.baptism_date ?? "",
          anniversary: data.anniversary ?? "",
          familyId: data.family_id ?? null,
          notes: data.notes ?? "",
          relationships: Array.isArray(data.relationships)
            ? data.relationships
                .map((rel: any) => ({
                  ...rel,
                  memberIds: [...(rel.memberIds ?? [])].filter(Boolean).sort(),
                }))
                .filter((rel: any) => rel.memberIds.length === 2)
            : [],
        } as Member);
      } else {
        setMember(null);
      }

      setLoading(false);
    }

    loadMember();
  }, [church_id, memberId]);

  if (!church_id) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading member…</p>;
  }

  if (!member) {
    return <p className="text-red-600">Member not found.</p>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold">
        Edit {member.firstName ?? member.first_name} {member.lastName ?? member.last_name}
      </h1>

      <MemberForm
        churchId={church_id}
        member={member}
        onSuccess={() => {
          router.push(`/church/${church_id}/members`);
        }}
      />
    </>
  );
}
