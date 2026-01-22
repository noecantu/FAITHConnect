'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getServicePlans } from '@/lib/servicePlans';
import type { ServicePlan } from '@/lib/types';

import { ServicePlanFormDialog } from '@/components/service-plans/ServicePlanFormDialog';

export default function ServicePlanPage() {
  const churchId = 'default-church'; // Replace with your auth context or hook

  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);

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

  function openEditDialog(plan: ServicePlan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingPlan(null);
    loadPlans(); // Refresh list after save
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Service Plans</h1>

        <Button onClick={openAddDialog}>
          Add Service Plan
        </Button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && plans.length === 0 && (
        <p className="text-muted-foreground">No service plans yet</p>
      )}

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium text-lg">{plan.title}</div>
              <div className="text-sm text-muted-foreground">{plan.date}</div>
            </div>

            <Button variant="outline" onClick={() => openEditDialog(plan)}>
              Edit
            </Button>
          </Card>
        ))}
      </div>

      <ServicePlanFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        churchId={churchId}
        plan={editingPlan}
      />
    </div>
  );
}
