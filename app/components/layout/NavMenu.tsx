//app/components/layout/NavMenu.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  DollarSign,
  Menu,
  Settings,
  LogOut,
  FileText,
  Music,
  ListMusic,
  CalendarHeart,
  CreditCard,
  Home,
  CalendarCheck,
  Activity,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { Button } from "../ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useChurch } from "@/app/hooks/useChurch";
import { clearLogoutTransition, startLogoutTransition } from "@/app/hooks/useAuth";
import { AlertDialogAction, AlertDialogCancel } from "@radix-ui/react-alert-dialog";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: boolean;
  isSubmenu?: boolean;
  exact?: boolean;
};

export function NavMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const { toast } = useToast();
  const { churchId } = useChurchId();
  const { church } = useChurch(churchId);
  const { roles = [] } = usePermissions();

  const typedRoles = roles as Role[];

  if (pathname.startsWith("/onboarding")) return null;
  if (pathname.match(/\/[^/]+\/attendance\/self-checkin/)) return null;

  // --- PERMISSIONS ---
  const isRootAdmin = can(typedRoles, "system.manage");
  const isDistrictAdmin = typedRoles.includes("DistrictAdmin");
  const isRegionalAdmin = typedRoles.includes("RegionalAdmin");
  const isChurchAdmin = can(typedRoles, "church.manage") && !!churchId;
  const isChurchDisabled = church?.status === "disabled";

  const canSeeContributions = can(typedRoles, "contributions.read");
  const canAccessMusic = can(typedRoles, "music.read");
  const canAccessServicePlan = can(typedRoles, "servicePlans.read");
  const canSeeAttendance = can(typedRoles, "attendance.read");
  const canSeeReports =
    can(typedRoles, "members.read") ||
    can(typedRoles, "contributions.read") ||
    can(typedRoles, "attendance.read");

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function getIconColorClass(href: string) {
    if (href.includes('/attendance')) return 'text-amber-500';
    if (href.includes('/contributions')) return 'text-emerald-500';
    if (href.includes('/calendar')) return 'text-sky-500';
    if (href.includes('/members') || href.includes('/users') || href.includes('/churches')) return 'text-blue-500';
    if (href.includes('/music')) return 'text-gray-500';
    if (href.includes('/service-plan')) return 'text-violet-500';
    if (href.includes('/reports') || href.includes('/logs')) return 'text-orange-500';
    if (href.includes('/settings')) return 'text-cyan-500';
    if (href.includes('/health')) return 'text-red-500';
    if (href === '/admin' || href.endsWith('/user') || href.includes('/admin/church/')) return 'text-indigo-500';
    return 'text-white/70';
  }

  // --- MENU CONFIGS ---
  const rootAdminMenu = [
    { href: "/admin", label: "Dashboard", icon: Home, exact: true },
    { href: "/admin/churches", label: "Churches", icon: Users },
    { href: "/admin/all-users", label: "All Users", icon: Users },
    { href: "/admin/users", label: "System Users", icon: Users },
    { href: "/admin/logs", label: "Activity Logs", icon: FileText },
    { href: "/admin/settings/health", label: "Platform Health", icon: CalendarHeart },
    { href: "/admin/subscription-audit", label: "Subscription Audit", icon: CreditCard },
    { href: "/admin/settings", label: "System Settings", icon: Settings, exact: true },
  ];

  const districtAdminMenu = [
    { href: "/admin/district", label: "Dashboard", icon: Home, exact: true },
    { href: "/admin/district/regions", label: "My Regions", icon: Users },
    { href: "/admin/district/regions/pending", label: "Pending Regions", icon: FileText },
    { href: "/admin/district/users", label: "District Users", icon: Users },
    { href: "/admin/district/settings", label: "Settings", icon: Settings },
  ];

  const regionalAdminMenu = [
    { href: "/admin/regional/churches", label: "Regional Churches", icon: Users },
    { href: "/admin/regional/users", label: "Regional Users", icon: Users },
    { href: "/admin/regional/select-district", label: "My District", icon: MapPin },
    { href: "/admin/regional/settings", label: "Settings", icon: Settings },
  ];

  const churchAdminMenu = [
    { href: `/admin/church/${churchId}`, label: "Dashboard", icon: Home, exact: true },
    { href: `/church/${churchId}/attendance`, label: "Attendance", icon: CalendarCheck, permission: canSeeAttendance, isSubmenu: true },
    { href: `/church/${churchId}/calendar`, label: "Calendar", icon: Calendar },
    { href: `/church/${churchId}/contributions`, label: "Contributions", icon: DollarSign, permission: canSeeContributions },
    { href: `/church/${churchId}/members`, label: "Members", icon: Users },
    { href: `/church/${churchId}/music`, label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
    { href: `/church/${churchId}/service-plan`, label: "Service Plans", icon: CalendarHeart, permission: canAccessServicePlan },
    { href: `/admin/church/${churchId}/settings`, label: "Settings", icon: Settings },
    { href: `/church/${churchId}/reports`, label: "Reports", icon: FileText, permission: canSeeReports },
  ];

  const userMenu = [
    { href: `/church/${churchId}/user`, label: "Dashboard", icon: Home, exact: true },
    { href: `/church/${churchId}/calendar`, label: "Calendar", icon: Calendar },
    { href: `/church/${churchId}/contributions`, label: "Contributions", icon: DollarSign, permission: canSeeContributions },
    { href: `/church/${churchId}/music`, label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
    { href: `/church/${churchId}/reports`, label: "Reports", icon: FileText, permission: canSeeReports },
    { href: `/church/${churchId}/user/settings`, label: "Settings", icon: Settings },
  ];

  const activeMenu = isRootAdmin
    ? rootAdminMenu
    : isDistrictAdmin
    ? districtAdminMenu
    : isRegionalAdmin
    ? regionalAdminMenu
    : isChurchAdmin
    ? isChurchDisabled
      ? [{ href: `/admin/church/${churchId}`, label: "Dashboard", icon: Home, exact: true }]
      : churchAdminMenu
    : isChurchDisabled
      ? [{ href: `/church/${churchId}/user`, label: "Dashboard", icon: Home, exact: true }]
      : userMenu;

  // --- RENDERER ---
  function renderMenuItems(items: MenuItem[]) {
    return items
      .filter((item) => item.permission !== false)
      .map((item) => {
        // MUSIC SUBMENU
        if (item.isSubmenu && item.href.endsWith("/music")) {
          return (
            <DropdownMenuSub key="music">
              <DropdownMenuSubTrigger className={isActive(`/church/${churchId}/music`) ? "bg-accent" : ""}>
                <item.icon className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Music</span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <Link href={`/church/${churchId}/music/setlists`}>
                  <DropdownMenuItem className={isActive(`/church/${churchId}/music/setlists`) ? "bg-accent" : ""}>
                    <ListMusic className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>Set Lists</span>
                  </DropdownMenuItem>
                </Link>

                <Link href={`/church/${churchId}/music/songs`}>
                  <DropdownMenuItem className={isActive(`/church/${churchId}/music/songs`) ? "bg-accent" : ""}>
                    <Music className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>Songs</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }

        // ATTENDANCE SUBMENU
        if (item.isSubmenu && item.href.endsWith("/attendance")) {
          return (
            <DropdownMenuSub key="attendance">
              <DropdownMenuSubTrigger className={isActive(`/church/${churchId}/attendance`) ? "bg-accent" : ""}>
                <item.icon className="mr-2 h-4 w-4 text-amber-500" />
                <span>Attendance</span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <Link href={`/church/${churchId}/attendance`}>
                  <DropdownMenuItem className={isActive(`/church/${churchId}/attendance`, true) ? "bg-accent" : ""}>
                    <CalendarCheck className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Take Attendance</span>
                  </DropdownMenuItem>
                </Link>

                <Link href={`/church/${churchId}/attendance/history`}>
                  <DropdownMenuItem className={isActive(`/church/${churchId}/attendance/history`) ? "bg-accent" : ""}>
                    <Activity className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Attendance History</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }

        // NORMAL ITEMS
        return (
          <Link href={item.href} key={item.href}>
            <DropdownMenuItem className={isActive(item.href, item.exact) ? "bg-accent" : ""}>
              <item.icon className={`mr-2 h-4 w-4 ${getIconColorClass(item.href)}`} />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </Link>
        );
      });
  }

  // --- LOGOUT ---
  const handleLogout = async () => {
    setIsLogoutAlertOpen(false);
    startLogoutTransition();

    try {
      await fetch("/api/auth/session/logout", {
        method: "POST",
        credentials: "include",
      });

      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("logout error:", error);
      toast({
        title: "Logout failed",
        description: "Please try again.",
      });
    } finally {
      clearLogoutTransition();
    }
  };

  return (
    <>
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {renderMenuItems(activeMenu)}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsLogoutAlertOpen(true)}>
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>You will be returned to the login screen.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>

            <AlertDialogAction asChild autoFocus>
              <Button variant="default" onClick={handleLogout}>
                Log Out
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
