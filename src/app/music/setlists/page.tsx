'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChurchId } from '@/hooks/useChurchId';
import { useSetLists } from '@/hooks/useSetLists';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from "next/navigation";

export default function SetListsPage() {
  // -----------------------------
  // ALL HOOKS MUST RUN FIRST
  // -----------------------------
  const churchId = useChurchId();
  const { lists, loading } = useSetLists(churchId);

  const {
    isAdmin,
    isMusicManager,
    isMusicMember,
    loading: rolesLoading
  } = useUserRoles(churchId);

  const canManage = isAdmin || isMusicManager;
  const canView = isAdmin || isMusicManager || isMusicMember;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date-desc' | 'date-asc' | 'title-asc'>('date-desc');
  const router = useRouter();

  const filtered = useMemo(() => {
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
  }, [lists, search, sort]);

  // -----------------------------
  // CONDITIONAL RETURNS AFTER HOOKS
  // -----------------------------
  if (!churchId || loading || rolesLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Set Lists" />
        <p className="text-muted-foreground">Loading set lists…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Set Lists" />
        <p className="text-muted-foreground">
          You do not have permission to view set lists.
        </p>
      </div>
    );
  }

  const rows = filtered.map((setList) => {
    const totalSets = setList.sections.length;
    const totalSongs = setList.sections.reduce(
      (sum, section) => sum + section.songs.length,
      0
    );

    return {
      id: setList.id,
      title: setList.title,
      date: setList.date,
      totalSets,
      totalSongs,
    };
  });

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="space-y-6">

      <PageHeader
        title={`Set Lists (${lists.length})`}
        subtitle="Each row represents a full set list."
      >
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

      {/* Sticky Search + Sort Bar */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="w-full flex items-center gap-2 py-2">

          <Input
            className="w-full"
            placeholder="Search set lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSearch('')}
              className="shrink-0"
            >
              Clear
            </Button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm text-muted-foreground"> Sort: </span>

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

      {/* List Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 px-2">Event</th>
            <th className="text-left py-2 px-2">Date</th>
            <th className="text-left py-2 px-2">Sections</th>
            <th className="text-left py-2 px-2">Songs</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-accent cursor-pointer"
              onClick={() => router.push(`/music/setlists/${row.id}`)}
            >
              <td className="py-2 px-2">{row.title}</td>

              <td className="py-2 px-2">
                {row.date ? format(new Date(row.date), 'M/d/yy, h:mm a') : '—'}
              </td>

              <td className="py-2 px-2">{row.totalSets}</td>

              <td className="py-2 px-2">{row.totalSongs}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}
