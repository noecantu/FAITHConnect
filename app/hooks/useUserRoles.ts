'use client';

import { useAuth } from './useAuth';

export function useUserRoles(churchId: string | null) {
  const { user, loading: authLoading } = useAuth();

  const roles = user?.roles ?? [];
  const loading = authLoading;

  return {
    roles,
    loading,
    isAdmin: roles.includes('Admin'),
    isMemberManager: roles.includes('Admin') || roles.includes('MemberManager'),
    isFinance: roles.includes('Admin') || roles.includes('Finance'),
    isEventManager: roles.includes('Admin') || roles.includes('EventManager'),
    isMusicManager: roles.includes('Admin') || roles.includes('MusicManager'),
    isMusicMember: roles.includes('Admin') || roles.includes('MusicMember'),
    isServiceManager: roles.includes('Admin') || roles.includes('ServiceManager'),
    isAttendanceManager: roles.includes('Admin') || roles.includes('AttendanceManager'),
  };
}
