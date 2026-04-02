'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/app/components/page-header';
import { Input } from '@/app/components/ui/input';
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
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useRouter } from 'next/navigation';
import { usePreviewPagination } from '@/app/hooks/usePreviewPagination';
import { PreviewPaginationFooter } from '@/app/components/layout/PreviewPaginationFooter';

// TYPES
type SortType = "date-desc" | "date-asc" | "title-asc";
type FilterType = 'all' | 'future' | 'past';

export default function ServicePlanPage() {
  const { churchId, loading: churchLoading } = useChurchId();
  const { plans, loading: plansLoading, error, reload } = useServicePlans(churchId);

  const { canManageServicePlans, canReadServicePlans, loading: rolesLoading } = useUserRoles();

  const canManage = canManageServicePlans;
  const canView = canReadServicePlans;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>("date-desc");
  const [filter, setFilter] = useState<FilterType>('all');

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
      <div className="p-6">
        <PageHeader title="Service Plans" />
        <p className="text-red-500">Failed to load service plans.</p>
        <Button variant="outline" onClick={reload} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // RENDER
  return (
    <>
      <PageHeader
        title={`Service Plans`}
        subtitle={`Total: ${plans.length}`}
      />

      {/* Toolbar */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full">

          {/* Search bar */}
          <div className="w-full sm:flex-1 flex items-center gap-3">
            <Input
              className="w-full"
              placeholder="Search service plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search.length > 0 && (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Controls */}
          <div className="flex w-full gap-3 sm:w-auto sm:ml-auto">

            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="flex-1 min-w-0 sm:w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="future">Future</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="flex-1 min-w-0 sm:w-[150px]">
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

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p>No service plans found.</p>
          {(search || filter !== 'all') && (
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* ⭐ Card wrapper for list */}
      <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>All Service Plans</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* List */}
          <div className="space-y-3">
            {visible.map((plan) => {
              const totalSections = plan.sections.length;

              return (
                <div
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/service-plan/${plan.id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      router.push(`/service-plan/${plan.id}`);
                    }
                  }}
                  className="border rounded-md p-4 flex items-start justify-between cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="font-medium">{plan.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalSections} sections
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {format(plan.dateTime, "M/d/yy, h:mm a")}
                  </div>
                </div>
              );
            })}
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
        <Fab type="add" onClick={() => router.push("/service-plan/new")} />
      )}
    </>
  );
}
