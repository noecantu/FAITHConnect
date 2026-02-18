'use client';

import { useRouter, useParams } from 'next/navigation';
import { useServicePlan } from '@/app/hooks/useServicePlan';
import { useChurchId } from '@/app/hooks/useChurchId';
import { ServicePlanFormDialog } from '@/app/components/service-plans/ServicePlanFormDialog';
import { useState } from 'react';

export default function EditServicePlanPage() {
  const router = useRouter();
  const { id } = useParams();
  const { churchId } = useChurchId();

  const { plan, loading } = useServicePlan(id as string);

  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    setTimeout(() => router.back(), 50);
  }

  if (!id || loading) return null;

  // Prevent dialog from opening before plan is loaded
  if (!plan) return null;

  return (
    <ServicePlanFormDialog
      isOpen={open}
      onClose={handleClose}
      churchId={churchId!}
      plan={plan}
    />
  );
}
