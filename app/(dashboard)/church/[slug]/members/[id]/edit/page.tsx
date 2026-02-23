"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/app/lib/firebase";
import { useChurchId } from "@/app/hooks/useChurchId";
import MemberForm from "../../components/MemberForm"; // adjust path if needed
import type { Member } from "@/app/lib/types";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const { churchId } = useChurchId();

  const memberId = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Load member data
  useEffect(() => {
    if (!churchId || !memberId) return;

    async function loadMember() {
      const ref = doc(db, "churches", churchId!, "members", memberId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setMember(snap.data() as Member);
      } else {
        setMember(null);
      }

      setLoading(false);
    }

    loadMember();
  }, [churchId, memberId]);

  if (!churchId) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading member…</p>;
  }

  if (!member) {
    return <p className="text-red-600">Member not found.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Edit {member.firstName} {member.lastName}
      </h1>

      <MemberForm
        churchId={churchId}
        member={member}
        onSuccess={() => {
          router.push(`/church/${churchId}/members/${memberId}`);
        }}
      />
    </div>
  );
}
