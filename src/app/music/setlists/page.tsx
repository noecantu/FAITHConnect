'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useSetLists } from '@/hooks/useSetLists';

export default function SetListsPage() {
  const churchId = useChurchId();
  const { lists: setLists, loading } = useSetLists(churchId);
  
  if (!churchId) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Set Lists</h1>

      <Button asChild>
        <Link href="/music/setlists/new">Create New Set List</Link>
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        {loading && <p>Loading set lists…</p>}

        {!loading &&
          setLists.map((list) => (
            <Link key={list.id} href={`/music/setlists/${list.id}`}>
              <Card className="p-4 hover:bg-accent cursor-pointer">
                <h2 className="font-semibold">{list.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(list.date).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
