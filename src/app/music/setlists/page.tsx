'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useChurchId } from '@/hooks/useChurchId';
import { useSetLists } from '@/hooks/useSetLists';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ChevronLeft } from 'lucide-react';

export default function SetListsPage() {
  const churchId = useChurchId();
  const { lists, loading } = useSetLists(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canManage = isAdmin || isMusicManager;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date-desc' | 'date-asc' | 'title-asc'>('date-desc');

  const filtered = useMemo(() => {
    if (!churchId) return [];

    let result = lists;

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(s));
    }

    if (sort === 'date-desc') {
      result = [...result].sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (sort === 'date-asc') {
      result = [...result].sort((a, b) => a.date.getTime() - b.date.getTime());
    } else if (sort === 'title-asc') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [churchId, lists, search, sort]);

  const stillLoading = !churchId || loading;

  // -----------------------------
  // SUBTITLE TEXT
  // -----------------------------
  const subtitleText =
  sort === 'date-desc'
    ? 'All set lists sorted by newest first.'
    : sort === 'date-asc'
    ? 'All set lists sorted by oldest first.'
    : 'All set lists sorted alphabetically by title.';

  return (
    <div className="space-y-6">

      {/* HEADER WITH ADD BUTTON */}
      <PageHeader title="Set Lists" subtitle={subtitleText}>
        <div className="flex items-center gap-2">
          <Link href="/music">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Music
            </Button>
          </Link>

          {canManage && (
            <Button asChild>
              <Link href="/music/setlists/new">Create Set List</Link>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Sticky Search + Sort Bar (identical to Songs) */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex items-center gap-2 py-2">

          {/* Search */}
          <Input
            className="w-full"
            placeholder="Search set lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Clear button */}
          {search.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSearch('')}
              className="shrink-0"
            >
              Clear
            </Button>
          )}

          {/* Sort */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm text-muted-foreground">Sort:</span>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="title-asc">Title A–Z</option>
            </select>
          </div>

        </div>
      </div>

      {/* LIST GRID (matches Songs grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stillLoading && (
          <p className="text-muted-foreground">Loading set lists…</p>
        )}

        {!stillLoading && filtered.length === 0 && (
          <p className="text-muted-foreground">No set lists found.</p>
        )}

        {!stillLoading &&
          filtered.map((list) => (
            <Card key={list.id} className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{list.title}</h2>
                <Separator />
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2">
                <ul className="space-y-2">
                  <li>
                    <Link href={`/music/setlists/${list.id}`}>
                      <Card className="p-4 hover:bg-accent cursor-pointer">
                        <h3 className="font-medium">{list.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {list.date.toLocaleDateString()}
                        </p>
                      </Card>
                    </Link>
                  </li>
                </ul>
              </div>
            </Card>
          ))}
      </div>

    </div>
  );
}
