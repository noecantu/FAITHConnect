'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';

import { getServicePlans } from '../lib/servicePlans';
import type { ServicePlan } from '../lib/types';

import { PageHeader } from '../components/page-header';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Fab } from '../components/ui/fab';

export default function ServicePlanPage() {
  const churchId = 'default-church';

  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('all');

  const router = useRouter();

  async function loadPlans() {
    setLoading(true);
    const data = await getServicePlans(churchId);
    setPlans(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredAndSorted = useMemo(() => {
    // Move `today` inside the memo so it doesn't need to be a dependency
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
      if (sort === 'newest') {
        return b.dateTime.getTime() - a.dateTime.getTime();
      }
      if (sort === 'oldest') {
        return a.dateTime.getTime() - b.dateTime.getTime();
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [plans, search, sort, filter]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Service Plans (${plans.length})`}
        subtitle="Each row represents a full service plan."
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">

        {/* Search */}
        <Input
          placeholder="Search service plans…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-1/3"
        />

        <div className="flex gap-4">

          {/* Filter */}
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as 'all' | 'future' | 'past')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="future">Future</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as 'newest' | 'oldest' | 'title')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* Loading */}
      {loading && <p>Loading service plans…</p>}

      {/* Empty */}
      {!loading && filteredAndSorted.length === 0 && (
        <p className="text-muted-foreground">No service plans found.</p>
      )}

      {/* Table */}
      {!loading && filteredAndSorted.length > 0 && (
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

      <Fab type="add" onClick={() => router.push('/service-plan/new')} />
    </div>
  );
}
