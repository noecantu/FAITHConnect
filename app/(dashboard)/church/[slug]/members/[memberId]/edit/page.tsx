'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useChurchId } from '@/app/hooks/useChurchId';
import { useMembers } from '@/app/hooks/useMembers';
import { useMemberForm } from '@/app/hooks/useMemberForm';

import MemberFormCard from '@/app/(dashboard)/church/[slug]/members/components/MemberForm';
import { PageHeader } from '@/app/components/page-header';

interface Props {
  params: {
    slug: string;
    memberId: string;
  };
}

export default function EditMemberPage({ params }: Props) {
  const router = useRouter();
  const churchId = useChurchId();

  const { members, isLoading, error } = useMembers(churchId);
  const member = members.find((m) => m.id === params.memberId);

  const {
    firstName,
    lastName,
    email,
    phone,
    setFirstName,
    setLastName,
    setEmail,
    setPhone,
    saveMember,
    deleteMember,
    isSaving,
    isDeleting,
    loadFromMember,
  } = useMemberForm(churchId);

  // Load member data into the form
  useEffect(() => {
    if (member) {
      loadFromMember(member);
    }
  }, [member, loadFromMember]);

  // LOADING
  if (isLoading) {
    return <p className="text-muted-foreground">Loading member…</p>;
  }

  // ERROR
  if (error || !member) {
    return <p className="text-red-600">Member not found.</p>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title={`Edit ${member.firstName} ${member.lastName}`}
        description="Update member information"
      />

      <MemberFormCard
        mode="edit"
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setEmail={setEmail}
        setPhone={setPhone}
        onSave={async () => {
          await saveMember(member.id);
          router.push(`/church/${params.slug}/members/${member.id}`);
        }}
        onDelete={async () => {
          await deleteMember(member.id);
          router.push(`/church/${params.slug}/members`);
        }}
        onClose={() =>
          router.push(`/church/${params.slug}/members/${member.id}`)
        }
        isSaving={isSaving}
        isCreating={false}
      />
    </div>
  );
}
