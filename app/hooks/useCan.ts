import { useMemo } from "react";
import { can } from "@/app/lib/auth/permissions";
import type { Permission } from "@/app/lib/auth/permissions";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

export function useCan(permission: Permission): boolean {
  const { user } = useCurrentUser();

  const roles = user?.roles ?? [];

  return useMemo(() => {
    return can(roles, permission);
  }, [roles, permission]);
}
