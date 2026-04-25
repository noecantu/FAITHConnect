"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
;
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
      const ref = doc(db, "churches", church_id!, "members", memberId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();

        setMember({
          id: snap.id,
          ...data,
          birthday: data.birthday
            ? data.birthday instanceof Timestamp
              ? data.birthday.toDate().toISOString().substring(0, 10)
              : data.birthday // already a string
            : "",
          baptismDate: data.baptismDate
            ? data.baptismDate instanceof Timestamp
              ? data.baptismDate.toDate().toISOString().substring(0, 10)
              : data.baptismDate
            : "",
          anniversary: data.anniversary
            ? data.anniversary instanceof Timestamp
              ? data.anniversary.toDate().toISOString().substring(0, 10)
              : data.anniversary
            : "",
          relationships: Array.isArray(data.relationships)
            ? data.relationships
                .map((rel: any) => ({
                  ...rel,
                  memberIds: [...rel.memberIds].filter(Boolean).sort(),
                }))
                .filter((rel) => rel.memberIds.length === 2)
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
        Edit {member.first_name} {member.last_name}
      </h1>

      <MemberForm
        church_id={church_id}
        member={member}
        onSuccess={() => {
          router.push(`/church/${church_id}/members`);
        }}
      />
    </>
  );
}
