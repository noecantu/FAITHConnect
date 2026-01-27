'use client';

import { PageHeader } from '../../page-header';
import { Button } from '../../ui/button';
import { useChurchId } from '../../../hooks/useChurchId';
import { useSetLists } from '../../../hooks/useSetLists';
import { useUserRoles } from '../../../hooks/useUserRoles';
import { SetListList } from '../SetListList';
import { SetListEditorDialog } from '../SetListEditorDialog';

export default function SetListsPage() {
  const churchId = useChurchId();
  const { lists, loading } = useSetLists(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);

  const canManage = isAdmin || isMusicManager;

  return (
    <>
      <PageHeader title="Set Lists" />

      <div className="flex justify-end mb-4">
        {canManage && (
          <SetListEditorDialog mode="create">
            <Button>Create Set List</Button>
          </SetListEditorDialog>
        )}
      </div>

      <SetListList lists={lists} loading={loading} canManage={canManage} />
    </>
  );
}
