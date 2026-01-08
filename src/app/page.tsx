import { members } from '@/lib/data';
import { Member } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { MemberCard } from '@/app/members/member-card';

export default function MembersPage() {
  // In a real app, you would fetch this data from an API
  const allMembers: Member[] = members;

  return (
    <>
      <PageHeader title="Members"></PageHeader>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}
