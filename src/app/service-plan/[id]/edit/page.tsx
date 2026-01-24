'use client';

import { useRouter, useParams } from 'next/navigation';
import { useServicePlan } from '@/hooks/useServicePlan';
import { useChurchId } from '@/hooks/useChurchId';
import { ServicePlanFormDialog } from '@/components/service-plans/ServicePlanFormDialog';
import { useState } from 'react';

export default function EditServicePlanPage() {
  const router = useRouter();
  const { id } = useParams();
  const { plan, loading } = useServicePlan(id as string);
  const churchId = useChurchId();

  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    // Delay navigation until after the dialog closes
    setTimeout(() => router.back(), 50);
  }

  if (loading) return null;

  return (
    <ServicePlanFormDialog
      isOpen={open}
      onClose={handleClose}
      churchId={churchId!}
      plan={plan}
    />
  );
}
