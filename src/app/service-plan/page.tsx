'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

import { getServicePlans } from '@/lib/servicePlans';
import type { ServicePlan } from '@/lib/types';

import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Fab } from '@/components/ui/fab';

export default function ServicePlanPage() {
  const churchId = 'default-church';

  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
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

  function openAddDialog() {
    setEditingPlan(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Service Plans (${plans.length})`}
        subtitle="Each row represents a full service plan."
      >
      </PageHeader>
  
      {loading && <p>Loading service plans…</p>}
  
      {!loading && plans.length === 0 && (
        <p className="text-muted-foreground">No service plans yet</p>
      )}
  
      {/* Table layout */}
      {!loading && plans.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-2">Event</th>
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Sections</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => {
              const totalSections = plan.sections.length;

              return (
                <tr
                  key={plan.id}
                  className="border-b hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/service-plan/${plan.id}`)}
                >
                  <td className="py-2 px-2">{plan.title}</td>

                  <td className="py-2 px-2">
                    {plan.date
                      ? format(new Date(plan.date), 'M/d/yy, h:mm a')
                      : '—'}
                  </td>

                  <td className="py-2 px-2">{totalSections}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Fab
        type="add"
        onClick={() => router.push('/service-plan/new')}
      />

    </div>
  );
  
}
