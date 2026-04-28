import { useMemo } from "react";
import { can } from "@/app/lib/auth/permissions";
import type { Permission } from "@/app/lib/auth/permissions";
import { useAuth } from "@/app/hooks/useAuth";

export function useCan(permission: Permission): boolean {
  const { user } = useAuth();

  const roles = user?.roles ?? [];
  const grants = user?.permissions ?? [];

  return useMemo(() => {
    return can(roles, permission, grants);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, permission, grants]);
}
