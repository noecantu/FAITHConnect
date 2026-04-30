//app/(dashboard)/service-plan/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/app/components/page-header';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/app/components/ui/select';
import { Fab } from '@/app/components/ui/fab';

import { useChurchId } from '@/app/hooks/useChurchId';
import { useServicePlans } from '@/app/hooks/useServicePlans';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { usePreviewPagination } from '@/app/hooks/usePreviewPagination';
import { PreviewPaginationFooter } from '@/app/components/layout/PreviewPaginationFooter';
import { SearchBar } from '@/app/components/ui/search-bar';
import { CalendarDays, ChevronRight, Layers3 } from 'lucide-react';

// TYPES
type SortType = "date-desc" | "date-asc" | "title-asc";
type FilterType = 'all' | 'future' | 'past';

export default function ServicePlanPage() {
  const { churchId, loading: churchLoading } = useChurchId();
  const { plans, loading: plansLoading, error, reload } = useServicePlans(churchId);

  const { canManageServicePlans, canReadServicePlans, loading: rolesLoading } = usePermissions();

  const canManage = canManageServicePlans;
  const canView = canReadServicePlans;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>("date-asc");
  const [filter, setFilter] = useState<FilterType>('future');

  const router = useRouter();

  // TYPE-SAFE HANDLERS
  const handleSortChange = (value: string) => {
    if (value === "date-desc" || value === "date-asc" || value === "title-asc") {
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
    if (!plans) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result = [...plans];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(s));
    }

    if (filter === 'future') {
      result = result.filter((p) => p.dateTime.getTime() >= today.getTime());
    } else if (filter === 'past') {
      result = result.filter((p) => p.dateTime.getTime() < today.getTime());
    }

    if (sort === "date-desc") {
      result.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    } else if (sort === "date-asc") {
      result.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    } else if (sort === "title-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [plans, search, sort, filter]);

  // PAGINATION — 20 per page
  const {
    page,
    totalPages,
    start,
    end,
    total,
    setPage,
    visible
  } = usePreviewPagination(filtered, 20);

  // LOADING + PERMISSIONS
  if (churchLoading || plansLoading || rolesLoading) {
    return (
      <>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Loading service plans…</p>
      </>
    );
  }

  if (!churchId) {
    return (
      <>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </>
    );
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">You do not have permission to view service plans.</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Service Plans" />
        <p className="text-red-500">Failed to load service plans.</p>
        <Button variant="outline" onClick={reload} className="mt-4">
          Try Again
        </Button>
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
                  {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                  <CalendarDays className="h-3 w-3" />
                  {filter === 'all' ? 'All dates' : filter === 'future' ? 'Upcoming' : 'Past'}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Service Plans</h1>
              <p className="text-sm text-white/55">Browse, search, and launch each service plan with the same workflow styling as detail pages.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="w-full sm:flex-1 flex items-center gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search Service Plans..."
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
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* ⭐ Card wrapper for list */}
      <Card className="relative overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.26)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:60ms]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
        <CardHeader className="relative">
          <CardTitle className="text-xl tracking-tight text-white/95">All Service Plans</CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-6">

          {/* List */}
          <div className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/25 bg-black/35 px-6 py-12 text-center">
                <div className="mx-auto max-w-md space-y-3">
                  <p className="text-base font-medium text-white/90">
                    {plans.length === 0 ? 'No service plans yet' : 'No service plans match your filters'}
                  </p>
                  <p className="text-sm text-white/60">
                    {plans.length === 0
                      ? 'Create your first service plan to organize each section for your next service.'
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
                        onClick={() => router.push(`/church/${churchId}/service-plan/new`)}
                      >
                        Create Service Plan
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              visible.map((plan, index) => {
                const totalSections = plan.sections.length;

                return (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/church/${churchId}/service-plan/${plan.id}`)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        router.push(`/church/${churchId}/service-plan/${plan.id}`);
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
                      <div className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">{plan.title}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-white/70">
                          <Layers3 className="h-3.5 w-3.5 text-white/50" />
                          {totalSections} {totalSections === 1 ? 'section' : 'sections'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs text-white/70">
                        <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
                        {format(plan.dateTime, "M/d/yy, h:mm a")}
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/35 transition-colors group-hover:text-white/75" />
                    </div>
                  </div>
                );
              })
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
            label="service plans"
          />
        </CardContent>
      </Card>

      {canManage && (
        <Fab type="add" onClick={() => router.push(`/church/${churchId}/service-plan/new`)} />
      )}
    </>
  );
}
