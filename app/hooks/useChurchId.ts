'use client';

import { useAuth } from './useAuth';

export function useChurchId() {
  const { user, loading: authLoading } = useAuth();

  return {
    churchId: user?.churchId ?? null,
    loading: authLoading,
  };
}
