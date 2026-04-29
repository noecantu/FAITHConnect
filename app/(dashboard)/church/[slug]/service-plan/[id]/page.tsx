//app/(dashboard)/service-plan/[id]/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { useServicePlanDetail } from '@/app/hooks/useServicePlanDetail';
import { ServicePlanDetailView } from '@/app/components/service-plans/ServicePlanDetailView';
import { DuplicateServicePlanDialog } from '@/app/components/service-plans/DuplicateServicePlanDialog';
import { DeleteServicePlanDialog } from '@/app/components/service-plans/DeleteServicePlanDialog';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ServicePlanDetailPage() {
  const router = useRouter();
  const {
    churchId,
    plan,
    members,
    canView,
    canEdit,
    loading,
  } = useServicePlanDetail();

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading) {
    return (
      <>
        <PageHeader title="Service Plan" />
        <p className="text-muted-foreground">Loading service plan…</p>
      </>
    );
  }

  if (!canView || !plan) {
    return (
      <>
        <PageHeader title="Service Plan" />
        <p className="text-muted-foreground">
          {canView ? 'Service Plan not found.' : 'You do not have permission to view this service plan.'}
        </p>
      </>
    );
  }

  const formattedDate = plan.dateTime
    ? format(plan.dateTime, 'M/d/yy, h:mm a')
    : '—';

  return (
    <>
      <ServicePlanDetailView
        plan={plan}
        members={members}
        formattedDate={formattedDate}
        canEdit={canEdit}
        onDuplicate={() => setDuplicateOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        router={router}
        churchId={churchId}
      />

      {churchId && (
        <DuplicateServicePlanDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          plan={plan}
          churchId={churchId}
          router={router}
        />
      )}

      {churchId && (
        <DeleteServicePlanDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          plan={plan}
          churchId={churchId}
          router={router}
        />
      )}

    </>
  );
}
