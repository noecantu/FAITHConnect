'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useMembers } from '@/app/hooks/useMembers';
import { useSongs } from '@/app/hooks/useSongs';
import { getServicePlanById } from '@/app/lib/servicePlans';
import type { ServicePlan } from '@/app/lib/types';

export function useServicePlanDetail() {
  const { id } = useParams();
  const { churchId } = useChurchId();

  const paramsReady = Boolean(churchId && id);

  const { members, loading: membersLoading } =
    paramsReady ? useMembers() : { members: [], loading: true };

  const { songs, loading: songsLoading } =
    paramsReady ? useSongs(churchId!) : { songs: [], loading: true };

  const {
    canReadServicePlans,
    canManageServicePlans,
    loading: rolesLoading
  } = paramsReady
    ? usePermissions()
    : { canReadServicePlans: false, canManageServicePlans: false, loading: true };

  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const canView = canReadServicePlans;
  const canEdit = canManageServicePlans;

  useEffect(() => {
    if (!paramsReady) return;

    const load = async () => {
      const data = await getServicePlanById(churchId!, id as string);
      setPlan(data);
      setLoading(false);
    };

    load();
  }, [paramsReady, churchId, id]);

  return {
    id,
    churchId,
    plan,
    members,
    songs,
    canView,
    canEdit,
    loading:
      loading || membersLoading || songsLoading || rolesLoading,
  };
}
