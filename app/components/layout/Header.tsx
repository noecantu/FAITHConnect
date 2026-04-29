'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { NavMenu } from './NavMenu';
import { usePermissions } from "@/app/hooks/usePermissions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAuth } from "@/app/hooks/useAuth";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useToast } from '@/app/hooks/use-toast';

export default function Header() {
  const { user, loading } = useAuth();
  const { roles = [] } = usePermissions();
  const { churchId } = useChurchId();
  const { toast } = useToast();
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);

  if (loading) return null;

  const typedRoles = roles as Role[];

  const isLoggedIn = typedRoles.length > 0 || Boolean(churchId);
  if (!isLoggedIn) return null;

  const isRootAdmin = can(typedRoles, "system.manage");
  const isDistrictAdmin = typedRoles.includes("DistrictAdmin");
  const isRegionalAdmin = typedRoles.includes("RegionalAdmin");
  const isChurchAdmin = can(typedRoles, "church.manage") && churchId;

  let dashboardHref = "/";

  if (isRootAdmin) {
    dashboardHref = "/admin";
  } else if (isDistrictAdmin) {
    dashboardHref = "/admin/district";
  } else if (isRegionalAdmin) {
    dashboardHref = "/admin/regional";
  } else if (isChurchAdmin) {
    dashboardHref = `/admin/church/${churchId}`;
  } else if (churchId) {
    dashboardHref = `/church/${churchId}/user`;
  }

  const isImpersonating = user?.isImpersonating === true;

  async function handleStopImpersonation() {
    setIsStoppingImpersonation(true);

    try {
      const res = await fetch('/api/admin/impersonation/stop', {
        method: 'POST',
        credentials: 'include',
      });

      const body = await res.json().catch(() => ({ error: 'Failed to stop impersonation.' }));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to stop impersonation.');
      }

      window.location.assign('/admin/all-users');
    } catch (error) {
      setIsStoppingImpersonation(false);
      toast({
        title: 'Unable to stop impersonation',
        description: error instanceof Error ? error.message : 'Failed to stop impersonation.',
      });
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[9999] flex h-16 items-center border-b border-white/20 bg-black/80 backdrop-blur-xl px-4 md:px-6">
        <div className="h-16" />

        <Link href={dashboardHref} className="flex items-center gap-2 font-semibold">
          <img src="/FAITH_CONNECT_FLAME_LOGO.svg" alt="Faith Connect Logo" className="h-24 w-24" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isImpersonating && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-500/15 px-2.5 py-1.5 text-left text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.18)] transition hover:bg-sky-500/20"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-100">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <span className="hidden min-w-0 sm:flex sm:flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/85">
                      Support Mode
                    </span>
                  </span>
                  <Badge className="hidden border-sky-200/30 bg-sky-300/15 text-sky-100 md:inline-flex">
                    Active
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={10} className="w-80 border-sky-300/40 bg-[linear-gradient(180deg,rgba(14,116,144,0.98),rgba(8,47,73,0.98))] text-slate-50 backdrop-blur-xl shadow-[0_18px_40px_rgba(2,132,199,0.35)]">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white">Impersonation Active</p>
                    <p className="mt-1 text-sm text-slate-200">
                      You are viewing the app as {user?.email ?? 'user'}.
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Root Admin: {user?.impersonationActorEmail ?? 'Unknown'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="outline w-full bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={isStoppingImpersonation}
                    onClick={() => void handleStopImpersonation()}
                  >
                    {isStoppingImpersonation ? 'Stopping...' : 'Stop Impersonation'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <NavMenu />
        </div>
      </header>

      <div className="h-16" />
    </>
  );
}
