'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/app/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useSetLists } from '@/app/hooks/useSetLists';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useRouter } from "next/navigation";
import { Fab } from '@/app/components/ui/fab';
import { usePreviewPagination } from '@/app/hooks/usePreviewPagination';
import { PreviewPaginationFooter } from '@/app/components/layout/PreviewPaginationFooter';
import { SearchBar } from '@/app/components/ui/search-bar';

// TYPES
type SortType = 'date-desc' | 'date-asc' | 'title-asc';
type FilterType = 'all' | 'future' | 'past';

export default function SetListsPage() {
  const { churchId } = useChurchId();
  const { lists, loading } = useSetLists(churchId);

  const { canManageMusic, canReadMusic, loading: rolesLoading } = usePermissions();

  const canManage = canManageMusic;
  const canView = canReadMusic;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('date-desc');
  const [filter, setFilter] = useState<FilterType>('all');

  const router = useRouter();

  // TYPE-SAFE HANDLERS
  const handleSortChange = (value: string) => {
    if (value === 'date-desc' || value === 'date-asc' || value === 'title-asc') {
      setSort(value);
    }
  };

  const handleFilterChange = (value: string) => {
    if (value === 'all' || value === 'future' || value === 'past') {
      setFilter(value);
    }
  };

  // FILTER + SORT
  const filtered = useMemo(() => {
    let result = lists;

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(s));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'future') {
      result = result.filter((l) => l.dateTime.getTime() >= today.getTime());
    } else if (filter === 'past') {
      result = result.filter((l) => l.dateTime.getTime() < today.getTime());
    }

    if (sort === 'date-desc') {
      result = [...result].sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    } else if (sort === 'date-asc') {
      result = [...result].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    } else if (sort === 'title-asc') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [lists, search, sort, filter]);

  // ROWS — MUST BE BEFORE ANY RETURNS
  const rows = filtered.map((setList) => {
    const totalSets = setList.sections.length;
    const totalSongs = setList.sections.reduce(
      (sum, section) => sum + section.songs.length,
      0
    );

    return {
      id: setList.id,
      title: setList.title,
      date: setList.dateTime,
      totalSets,
      totalSongs,
    };
  });

  // PAGINATION — MUST BE BEFORE ANY RETURNS
  const {
    page,
    totalPages,
    start,
    end,
    total,
    setPage,
    visible
  } = usePreviewPagination(rows, 20);

  // LOADING + PERMISSIONS — SAFE NOW
  if (!churchId || loading || rolesLoading) {
    return (
      <>
        <PageHeader title="Set Lists" />
        <p className="text-muted-foreground">Loading set lists…</p>
      </>
    );
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Set Lists" />
        <p className="text-muted-foreground">
          You do not have permission to view set lists.
        </p>
      </>
    );
  }

  // RENDER
  return (
    <>
      <PageHeader
        title="Set Lists"
        subtitle={`Total: ${lists.length}`}
      />

      {/* Toolbar */}
      <div className="top-16 z-10">
        <div className="flex flex-wrap items-center gap-3 w-full">

          {/* Search bar */}
          <div className="w-full sm:flex-1 flex items-center gap-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Set Lists..."
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:ml-auto">

            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger
                className="
                  w-full h-9
                  bg-black/80 border border-white/20 backdrop-blur-xl
                  text-white/80
                  hover:bg-white/5 hover:border-white/20
                  transition
                "
              >
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="future">Future</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger
                className="
                  w-full h-9
                  bg-black/80 border border-white/20 backdrop-blur-xl
                  text-white/80
                  hover:bg-white/5 hover:border-white/20
                  transition
                "
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="title-asc">Title A–Z</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </div>

      {/* ⭐ Card wrapper for list + footer */}
      <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>All Sets</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* List */}
          <div className="space-y-3">
            {visible.map((row) => (
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/church/${churchId}/music/setlists/${row.id}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    router.push(`/music/setlists/${row.id}`);
                  }
                }}
                className="border border-white/20 rounded-md p-4 flex items-start justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {row.totalSets} sections • {row.totalSongs} songs
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {row.date ? format(row.date, "M/d/yy, h:mm a") : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <PreviewPaginationFooter
            start={start}
            end={end}
            total={total}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            label="set lists"
          />
        </CardContent>
      </Card>

      {canManage && (
        <Fab
          type="add"
          onClick={() => router.push(`/church/${churchId}/music/setlists/new`)}
        />
      )}
    </>
  );
}
