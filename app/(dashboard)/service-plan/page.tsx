'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/app/components/page-header';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
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

// -----------------------------
// TYPES
// -----------------------------
type SortType = 'newest' | 'oldest' | 'title';
type FilterType = 'all' | 'future' | 'past';

export default function ServicePlanPage() {
  const { churchId, loading: churchLoading } = useChurchId();
  const { plans, loading: plansLoading, error, reload } = useServicePlans(churchId);

  const {
    isAdmin,
    isServiceManager,
    loading: rolesLoading
  } = useUserRoles(churchId);

  const canManage = isAdmin || isServiceManager;
  const canView = isAdmin || isServiceManager;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('newest');
  const [filter, setFilter] = useState<FilterType>('all');

  const router = useRouter();

  // -----------------------------
  // TYPE-SAFE HANDLERS
  // -----------------------------
  const handleSortChange = (value: string) => {
    if (value === 'newest' || value === 'oldest' || value === 'title') {
      setSort(value);
    }
  };

  const handleFilterChange = (value: string) => {
    if (value === 'all' || value === 'future' || value === 'past') {
      setFilter(value);
    }
  };

  // -----------------------------
  // FILTER + SORT
  // -----------------------------
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

    if (sort === 'newest') {
      result.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    } else if (sort === 'oldest') {
      result.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    } else if (sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [plans, search, sort, filter]);

  // -----------------------------
  // LOADING + PERMISSIONS
  // -----------------------------
  if (churchLoading || plansLoading || rolesLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Loading service plans…</p>
      </div>
    );
  }

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">You do not have permission to view service plans.</p>
      </div>
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

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      <PageHeader
        title={`Service PLans`}
        subtitle={`Total: ${plans.length}`}
      />

      {/* Toolbar */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="flex flex-wrap items-center gap-3 py-3 w-full">

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
          <div className="flex items-center gap-3 sm:ml-auto w-full sm:w-auto">

            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="future">Future</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[150px]">
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

      {/* Card List */}
      <div className="mt-4 space-y-3">
        {filtered.map((plan) => {
          const totalSections = plan.sections.length;

          return (
            <Card
              key={plan.id}
              className="p-4 cursor-pointer transition-all hover:bg-accent hover:shadow-sm"
              onClick={() => router.push(`/service-plan/${plan.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalSections} sections
                  </p>
                </div>
                <div className="text-sm flex items-center gap-2">
                  {format(plan.dateTime, 'M/d/yy, h:mm a')}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {canManage && (
        <Fab type="add" onClick={() => router.push('/service-plan/new')} />
      )}
    </>
  );
}
