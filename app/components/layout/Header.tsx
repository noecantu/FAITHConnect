'use client';

import Link from 'next/link';
import { NavMenu } from './NavMenu';

import { usePermissions } from "@/app/hooks/usePermissions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export default function Header() {
  const { roles = [] } = usePermissions();
  const { churchId } = useChurchId();

  const typedRoles = roles as Role[];

  const isLoggedIn = typedRoles.length > 0 || Boolean(churchId);
  if (!isLoggedIn) return null;

  const isRootAdmin = can(typedRoles, "system.manage");
  const isRegionalAdmin = can(typedRoles, "region.manage");
  const isChurchAdmin = can(typedRoles, "church.manage") && churchId;

  let dashboardHref = "/";

  if (isRootAdmin) {
    dashboardHref = "/admin";
  } else if (isRegionalAdmin) {
    dashboardHref = "/admin/regional";
  } else if (isChurchAdmin) {
    dashboardHref = `/admin/church/${churchId}`;
  } else if (churchId) {
    dashboardHref = `/church/${churchId}/user`;
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-[9999]
          flex h-16 items-center
          border-b border-white/20
          bg-black/80 backdrop-blur-xl
          px-4 md:px-6"
      >
        <div className="h-16" />

        <Link href={dashboardHref} className="flex items-center gap-2 font-semibold">
          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="h-24 w-24"
          />
        </Link>

        <div className="ml-auto">
          <NavMenu />
        </div>
      </header>

      <div className="h-16" />
    </>
  );
}
