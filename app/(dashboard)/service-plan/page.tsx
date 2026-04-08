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
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useRouter } from 'next/navigation';
import { usePreviewPagination } from '@/app/hooks/usePreviewPagination';
import { PreviewPaginationFooter } from '@/app/components/layout/PreviewPaginationFooter';
import { SearchBar } from '@/app/components/ui/search-bar';
import { DashboardPage } from '../layout/DashboardPage';

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
      <DashboardPage>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Loading service plans…</p>
      </DashboardPage>
    );
  }

  if (!churchId) {
    return (
      <DashboardPage>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </DashboardPage>
    );
  }

  if (!canView) {
    return (
      <DashboardPage>
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">You do not have permission to view service plans.</p>
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage>
        <PageHeader title="Service Plans" />
        <p className="text-red-500">Failed to load service plans.</p>
        <Button variant="outline" onClick={reload} className="mt-4">
          Try Again
        </Button>
      </DashboardPage>
    );
  }

  // RENDER
  return (
    <DashboardPage>
      <PageHeader
        title={`Service Plans`}
        subtitle={`Total: ${plans.length}`}
      />

      {/* Toolbar */}
      <div className="top-16 z-10">
        <div className="flex flex-wrap items-center gap-3 w-full">

          {/* Search bar */}
          <div className="w-full sm:flex-1 flex items-center gap-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Service Plans..."
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:ml-auto">

            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger
                className="
                  w-full h-9
                  bg-black/40 border border-white/20 backdrop-blur-xl
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
                  bg-black/40 border border-white/20 backdrop-blur-xl
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

      {/* ⭐ Card wrapper for list */}
      <Card className="relative bg-black/30 border-white/20 backdrop-blur-xl">
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
                  className="border border-white/20 rounded-md p-4 flex items-start justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
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
    </DashboardPage>
  );
}
