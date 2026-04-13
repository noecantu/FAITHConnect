'use client';

import { useParams } from 'next/navigation';
import { useAuth } from './useAuth';

export function useChurchId() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  // 1. Church Admin route: /church/[slug]
  if (params?.slug) {
    return {
      churchId: params.slug as string,
      loading: authLoading,
    };
  }

  // 2. Regional Admin route: /admin/church/[churchId]
  if (params?.churchId) {
    return {
      churchId: params.churchId as string,
      loading: authLoading,
    };
  }

  // 3. Fallback: Church Admin user record
  return {
    churchId: user?.churchId ?? null,
    loading: authLoading,
  };
}
