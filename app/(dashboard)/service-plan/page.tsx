'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/app/components/ui/input';
import { PageHeader } from '@/app/components/page-header';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Fab } from '@/app/components/ui/fab';
import { Button } from '@/app/components/ui/button';

import { useChurchId } from '@/app/hooks/useChurchId';
import { useServicePlans } from '@/app/hooks/useServicePlans';
import { useUserRoles } from '@/app/hooks/useUserRoles';

export default function ServicePlanPage() {
  // ALL HOOKS MUST RUN FIRST
  const { churchId, loading: churchLoading } = useChurchId();
  const { plans, loading: plansLoading, error, reload } = useServicePlans(churchId);

  const {
    isAdmin,
    isServiceManager,
    loading: rolesLoading
  } = useUserRoles(churchId);

  // Permissions (mirroring Set Lists)
  const canManage = isAdmin || isServiceManager;
  const canView = isAdmin || isServiceManager;

  // Local UI state
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('all');

  const router = useRouter();

  // FILTER + SORT MEMO
  const filteredAndSorted = useMemo(() => {
    if (!plans) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result = [...plans];

    // SEARCH
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(s));
    }

    // FILTER
    if (filter === 'future') {
      result = result.filter((p) => p.dateTime.getTime() >= today.getTime());
    } else if (filter === 'past') {
      result = result.filter((p) => p.dateTime.getTime() < today.getTime());
    }

    // SORT
    result.sort((a, b) => {
      if (sort === 'newest') return b.dateTime.getTime() - a.dateTime.getTime();
      if (sort === 'oldest') return a.dateTime.getTime() - b.dateTime.getTime();
      if (sort === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [plans, search, sort, filter]);

  // CONDITIONAL RETURNS AFTER HOOKS
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
        <p className="text-muted-foreground">
          Unable to determine church context.
        </p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plans" />
        <p className="text-muted-foreground">
          You do not have permission to view service plans.
        </p>
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

  return (
    <>
      <PageHeader
        title={`Service Plans (${plans.length})`}
        subtitle="Each row represents a full service plan."
      />

      {/* Sticky Search + Sort Bar */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="w-full flex items-center gap-2 py-2">

          <Input
            className="w-full"
            placeholder="Search service plans..."
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

          <div className="flex items-center gap-3 shrink-0">

            {/* Filter */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground"> Filter: </span>

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as 'all' | 'future' | 'past')
                }
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value="all">All</option>
                <option value="future">Future</option>
                <option value="past">Past</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground"> Sort: </span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as 'newest' | 'oldest' | 'title')
                }
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Loading */}
      {plansLoading && <p>Loading service plans…</p>}

      {/* Empty */}
      {!plansLoading && filteredAndSorted.length === 0 && (
        <p className="text-muted-foreground">No service plans found.</p>
      )}

      {/* Table */}
      {!plansLoading && filteredAndSorted.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-2">Event</th>
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Sections</th>
            </tr>
          </thead>

          <tbody>
            {filteredAndSorted.map((plan) => {
              const totalSections = plan.sections.length;

              return (
                <tr
                  key={plan.id}
                  className="border-b hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/service-plan/${plan.id}`)}
                >
                  <td className="py-2 px-2">{plan.title}</td>

                  <td className="py-2 px-2">
                    {format(plan.dateTime, 'M/d/yy, h:mm a')}
                  </td>

                  <td className="py-2 px-2">{totalSections}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {canManage && (
        <Fab type="add" onClick={() => router.push('/service-plan/new')} />
      )}
    </>
  );
}