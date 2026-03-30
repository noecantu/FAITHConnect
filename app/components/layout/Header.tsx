'use client';

import Link from 'next/link';
import { NavMenu } from './NavMenu';

import { useUserRoles } from "@/app/hooks/useUserRoles";
import { useChurchId } from "@/app/hooks/useChurchId";
import { can } from "@/app/lib/auth/permissions/can";
import type { Role } from "@/app/lib/auth/permissions/roles";

export default function Header() {
  const { roles = [] } = useUserRoles();
  const { churchId } = useChurchId();

  const typedRoles = roles as Role[];

  const isRootAdmin = can(typedRoles, "system.manage");
  const isChurchAdmin = can(typedRoles, "church.manage") && churchId;

  let dashboardHref = "/";

  if (isRootAdmin) {
    dashboardHref = "/admin";
  } else if (isChurchAdmin) {
    dashboardHref = `/admin/church/${churchId}`;
  } else if (churchId) {
    dashboardHref = `/church/${churchId}/user`;
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
      <Link href={dashboardHref} className="flex items-center gap-2 font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/FAITH_CONEXION_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="h-24 w-24"
        />
      </Link>

      <div className="ml-auto">
        <NavMenu />
      </div>
    </header>
  );
}