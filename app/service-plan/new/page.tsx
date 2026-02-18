'use client';

import { useRouter } from 'next/navigation';
import { useChurchId } from '../../hooks/useChurchId';
import { ServicePlanFormDialog } from '../../components/service-plans/ServicePlanFormDialog';

export default function NewServicePlanPage() {
  const router = useRouter();
  const { churchId } = useChurchId();

  return (
    <ServicePlanFormDialog
      isOpen={true}
      onClose={() => router.back()}
      churchId={churchId!}
      plan={null} // null = Add mode
    />
  );
}
