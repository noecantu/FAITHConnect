import { members } from '@/lib/data';
import { Member } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { columns } from '@/components/members/columns';
import { DataTable } from '@/components/members/data-table';
import { MemberFormSheet } from '@/components/members/member-form-sheet';

export default function MembersPage() {
  // In a real app, you would fetch this data from an API
  const allMembers: Member[] = members;

  return (
    <>
      <PageHeader title="Members">
        <MemberFormSheet />
      </PageHeader>
      <DataTable columns={columns} data={allMembers} />
    </>
  );
}
