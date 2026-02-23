'use client';

import { useRouter } from 'next/navigation';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useMembers } from '@/app/hooks/useMembers';
import { Button } from '@/app/components/ui/button';
import { PageHeader } from '@/app/components/page-header';

import PhotoSection from '@/app/(dashboard)/church/[slug]/members/components/PhotoSection';
import MemberInfoSection from '@/app/(dashboard)/church/[slug]/members/components/MemberInfoSection';
import RelationshipsSection from '@/app/(dashboard)/church/[slug]/members/components/RelationshipsSection';
import StatusSection from '@/app/(dashboard)/church/[slug]/members/components/StatusSection';
import LoginAccessSection from '@/app/(dashboard)/church/[slug]/members/components/LoginAccessSection';

interface Props {
  params: {
    slug: string;
    memberId: string;
  };
}

export default function MemberProfilePage({ params }: Props) {
  const router = useRouter();
  const churchId = useChurchId();

  const { members, isLoading, error } = useMembers(churchId);
  const member = members.find((m) => m.id === params.memberId);

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
        title={`${member.firstName} ${member.lastName}`}
        description="Member profile and details"
        actions={
          <Button
            onClick={() =>
              router.push(`/church/${params.slug}/members/${member.id}/edit`)
            }
          >
            Edit Member
          </Button>
        }
      />

      {/* PHOTO */}
      <PhotoSection member={member} />

      {/* STATUS */}
      <StatusSection member={member} />

      {/* BASIC INFO */}
      <MemberInfoSection member={member} />

      {/* RELATIONSHIPS */}
      <RelationshipsSection member={member} allMembers={members} />

      {/* OPTIONAL: LOGIN ACCESS */}
      {member.userId && <LoginAccessSection member={member} />}
    </div>
  );
}
