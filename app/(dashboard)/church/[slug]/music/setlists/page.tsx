'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import { Button } from '@/app/components/ui/button';
import { CalendarDays, ChevronRight, Layers3, Music2 } from 'lucide-react';

// TYPES
type SortType = 'date-desc' | 'date-asc' | 'title-asc';
type FilterType = 'all' | 'future' | 'past';

export default function SetListsPage() {
  const { churchId, loading: churchLoading } = useChurchId();
  const { lists, loading } = useSetLists(churchId);

  const { canManageSetlists, canReadSetlists, loading: rolesLoading } = usePermissions();

  const canManage = canManageSetlists;
  const canView = canReadSetlists;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('date-asc');
  const [filter, setFilter] = useState<FilterType>('future');

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
  if (churchLoading || loading || rolesLoading) {
    return (
      <>
        <p className="text-muted-foreground">Loading set lists…</p>
      </>
    );
  }

  if (!churchId) {
    return (
      <>
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </>
    );
  }

  if (!canView) {
    return (
      <>
        <p className="text-muted-foreground">
          You do not have permission to view set lists.
        </p>
      </>
    );
  }

  // RENDER
  return (
    <>
      <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/90 via-black/75 to-black/60 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                  <Layers3 className="h-3 w-3" />
                  {lists.length} {lists.length === 1 ? 'list' : 'lists'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                  <CalendarDays className="h-3 w-3" />
                  {filter === 'all' ? 'All dates' : filter === 'future' ? 'Upcoming' : 'Past'}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Set Lists</h1>
              <p className="text-sm text-white/55">Browse, search, and open each set list with the same list styling used on Service Plans.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="w-full sm:flex-1 flex items-center gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search Set Lists..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:ml-auto">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full h-9 bg-black/75 border border-white/20 backdrop-blur-xl text-white/80 hover:bg-white/5 hover:border-white/20 transition">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="future">Future</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full h-9 bg-black/75 border border-white/20 backdrop-blur-xl text-white/80 hover:bg-white/5 hover:border-white/20 transition">
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
      </Card>

      {/* ⭐ Card wrapper for list + footer */}
      <Card className="relative overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.26)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:60ms]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
        <CardHeader className="relative">
          <CardTitle className="text-xl tracking-tight text-white/95">All Set Lists</CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-6">

          {/* List */}
          <div className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/25 bg-black/35 px-6 py-12 text-center">
                <div className="mx-auto max-w-md space-y-3">
                  <p className="text-base font-medium text-white/90">
                    {lists.length === 0 ? 'No set lists yet' : 'No set lists match your filters'}
                  </p>
                  <p className="text-sm text-white/60">
                    {lists.length === 0
                      ? 'Create your first set list to start planning songs and sections.'
                      : 'Try adjusting search, date filter, or sort settings to find what you need.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {(search || filter !== 'future' || sort !== 'date-asc') && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/30 bg-white/5 hover:bg-white/10"
                        onClick={() => {
                          setSearch('');
                          setFilter('future');
                          setSort('date-asc');
                        }}
                      >
                        Reset Filters
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        onClick={() => router.push(`/church/${churchId}/music/setlists/new`)}
                      >
                        Create Set List
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              visible.map((row, index) => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/church/${churchId}/music/setlists/${row.id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      router.push(`/church/${churchId}/music/setlists/${row.id}`);
                    }
                  }}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    backgroundImage:
                      index % 2 === 0
                        ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 42%, rgba(255,255,255,0.00) 100%)'
                        : 'linear-gradient(270deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 42%, rgba(255,255,255,0.00) 100%)',
                  }}
                  className="group border border-white/15 rounded-lg p-4 flex items-start justify-between cursor-pointer bg-white/[0.04] transition-all hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-sky-950/40 hover:shadow-[0_8px_20px_rgba(56,189,248,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div className="space-y-2">
                    <div className="text-2xl font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">{row.title}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-white/70">
                        <Layers3 className="h-3.5 w-3.5 text-white/50" />
                        {row.totalSets} {row.totalSets === 1 ? 'section' : 'sections'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-white/70">
                        <Music2 className="h-3.5 w-3.5 text-emerald-500" />
                        {row.totalSongs} {row.totalSongs === 1 ? 'song' : 'songs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex min-w-[11.5rem] items-center justify-center gap-2 rounded-md border border-white/20 bg-black/35 px-4 py-2 text-sm font-medium text-white/80 sm:min-w-[13rem] sm:text-base">
                      <CalendarDays className="h-4 w-4 text-sky-500 sm:h-5 sm:w-5" />
                      {row.date ? format(row.date, "M/d/yy, h:mm a") : "—"}
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/35 transition-colors group-hover:text-white/75" />
                  </div>
                </div>
              ))
            )}
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
