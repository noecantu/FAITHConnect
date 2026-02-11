'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useMembers } from '@/app/hooks/useMembers';
import { useSongs } from '@/app/hooks/useSongs';
import { getServicePlanById } from '@/app/lib/servicePlans';
import type { ServicePlan } from '@/app/lib/types';

export function useServicePlanDetail() {
  const { id } = useParams();
  const churchId = useChurchId();

  const { members, loading: membersLoading } = useMembers(churchId);
  const { songs, loading: songsLoading } = useSongs(churchId);

  const {
    isAdmin,
    isServiceManager,
    isMusicManager,
    isMusicMember,
    loading: rolesLoading
  } = useUserRoles(churchId);

  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const canView = isAdmin || isServiceManager || isMusicManager || isMusicMember;
  const canEdit = isAdmin || isServiceManager;

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getServicePlanById(churchId, id as string);
      setPlan(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

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
