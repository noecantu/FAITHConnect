'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useSetLists } from '@/hooks/useSetLists';
import { useUserRoles } from '@/hooks/useUserRoles';
import { SetListList } from '@/components/music/SetListList';
import Link from 'next/link';

export default function SetListsPage() {
  const churchId = useChurchId();
  const { lists, loading } = useSetLists(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);

  const canManage = isAdmin || isMusicManager;

  if (!churchId) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <PageHeader title="Set Lists" />

      <div className="flex justify-end mb-4">
        {canManage && (
          <Link href="/music/setlists/new">
            <Button>Create Set List</Button>
          </Link>
        )}
      </div>

      <SetListList lists={lists} loading={loading} canManage={canManage} />
    </>
  );
}
