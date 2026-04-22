"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useChurch } from "@/app/hooks/useChurch";
import { usePermissions } from "@/app/hooks/usePermissions";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import { useToast } from "@/app/hooks/use-toast";

export function ChurchDisabledGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { churchId } = useChurchId();
  const { church, loading: churchLoading } = useChurch(churchId);
  const { roles = [] } = usePermissions();

  const typedRoles = roles as Role[];
  const isRootAdmin = can(typedRoles, "system.manage");
  const isRegionalAdmin = can(typedRoles, "region.manage");
  const isChurchAdmin = can(typedRoles, "church.manage") && Boolean(churchId);

  useEffect(() => {
    if (!churchId || churchLoading) return;
    if (isRootAdmin || isRegionalAdmin) return;
    if (church?.status !== "disabled") return;

    const allowedDashboard = isChurchAdmin
      ? `/admin/church/${churchId}`
      : `/church/${churchId}/user`;

    if (pathname !== allowedDashboard) {
      router.replace(allowedDashboard);
      toast({
        title: "Church Access Restricted",
        description: "This church is disabled. Access is limited to the dashboard.",
      });
    }
  }, [
    churchId,
    churchLoading,
    church?.status,
    isRootAdmin,
    isRegionalAdmin,
    isChurchAdmin,
    pathname,
    router,
    toast,
  ]);

  return null;
}
