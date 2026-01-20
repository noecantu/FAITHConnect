'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSongs } from '@/hooks/useSongs';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SetListSongEditor } from '@/components/music/SetListSongEditor';
import { Button } from '@/components/ui/button';

export default function SetListEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const { songs: allSongs } = useSongs(churchId);

  const canManage = isAdmin || isMusicManager;

  const [setList, setSetList] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load set list
  useEffect(() => {
    if (!churchId || !id) return;

    const ref = doc(db, 'churches', churchId, 'setLists', id);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        router.replace('/music/setlists');
        return;
      }

      const data = snap.data();
      setSetList({
        id: snap.id,
        ...data,
        date: data.date?.toDate?.() ?? new Date(),
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId, id]);

  if (!canManage) {
    return <p className="text-muted-foreground">You do not have permission to edit this set list.</p>;
  }

  if (loading || !setList) {
    return <p className="text-muted-foreground">Loading set list…</p>;
  }

  return (
    <>
      <PageHeader title={setList.title} />

      <SetListSongEditor
        setList={setList}
        allSongs={allSongs}
        churchId={churchId}
      />
    </>
  );
}
