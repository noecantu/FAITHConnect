"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useChurch } from "@/app/hooks/useChurch";
import { usePermissions } from "@/app/hooks/usePermissions";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import { useToast } from "@/app/hooks/use-toast";

export function BillingLapsedGuard() {
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
    // Root and Regional admins are never blocked by billing state
    if (isRootAdmin || isRegionalAdmin) return;
    if (!church?.billingDelinquent) return;

    const allowedDashboard = isChurchAdmin
      ? `/admin/church/${churchId}`
      : `/church/${churchId}/user`;

    if (pathname !== allowedDashboard) {
      router.replace(allowedDashboard);
      toast({
        title: "Subscription Payment Failed",
        description:
          "Your church's subscription could not be renewed. Access is limited until payment is updated.",
        variant: "destructive",
      });
    }
  }, [
    churchId,
    churchLoading,
    church?.billingDelinquent,
    isRootAdmin,
    isRegionalAdmin,
    isChurchAdmin,
    pathname,
    router,
    toast,
  ]);

  return null;
}
