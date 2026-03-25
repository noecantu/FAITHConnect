"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Home,
  CalendarCheck,
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
import { useUserRoles } from "@/app/hooks/useUserRoles";
import { useChurchId } from "@/app/hooks/useChurchId";
import { AlertDialogAction, AlertDialogCancel } from "@radix-ui/react-alert-dialog";
import { can } from "@/app/lib/auth/permissions/can";
import type { Role } from "@/app/lib/auth/permissions/roles";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: boolean;
  isSubmenu?: boolean;
};

export function NavMenu() {
  const pathname = usePathname();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const { toast } = useToast();
  const { churchId } = useChurchId();
  const { roles = [] } = useUserRoles();

  const typedRoles = roles as Role[];

  // Hide NavMenu during onboarding
  if (pathname.startsWith("/onboarding")) return null;

  // Hide NavMenu during Self Check-In
  if (pathname.match(/\/[^/]+\/attendance\/self-checkin/)) return null;

  // --- PERMISSION MODEL ---
  const isRootAdmin = can(typedRoles, "system.manage");
  const isChurchAdmin = can(typedRoles, "church.manage") && churchId;

  const canSeeContributions = can(typedRoles, "contributions.read");
  const canAccessMusic = can(typedRoles, "music.read");
  const canAccessServicePlan = can(typedRoles, "servicePlans.read");
  const canSeeAttendance = can(typedRoles, "attendance.read");
  const canSeeReports =
    can(typedRoles, "members.read") ||
    can(typedRoles, "contributions.read") ||
    can(typedRoles, "attendance.read");

  // --- MENU CONFIGS ---
  const rootAdminMenu = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/churches", label: "Churches", icon: Users },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
    { href: "/admin/logs", label: "Activity Logs", icon: FileText },
    { href: "/admin/settings/health", label: "Platform Health", icon: CalendarHeart },
  ];

  const churchAdminMenu = [
    { href: `/admin/church/${churchId}`, label: "Dashboard", icon: Home },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck, permission: canSeeAttendance },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/contributions", label: "Contributions", icon: DollarSign, permission: canSeeContributions },
    { href: `/church/${churchId}/members`, label: "Members", icon: Users },
    { href: "/music", label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
    { href: "/service-plan", label: "Service Plans", icon: CalendarHeart, permission: canAccessServicePlan },
    { href: "/settings/access-management", label: "Settings", icon: Settings },
    { href: "/reports", label: "Reports", icon: FileText, permission: canSeeReports },
  ];

  const userMenu = [
    { href: `/church/${churchId}/user`, label: "Dashboard", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/contributions", label: "Contributions", icon: DollarSign, permission: canSeeContributions },
    { href: "/music", label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
    { href: "/reports", label: "Reports", icon: FileText, permission: canSeeReports },
  ];

  const activeMenu = isRootAdmin
    ? rootAdminMenu
    : isChurchAdmin
    ? churchAdminMenu
    : userMenu;

  // --- RENDERER ---
  function renderMenuItems(items: MenuItem[]) {
    return items
      .filter((item) => item.permission !== false)
      .map((item) => {
        if (item.isSubmenu && item.href === "/music") {
          return (
            <DropdownMenuSub key="music">
              <DropdownMenuSubTrigger
                className={pathname.startsWith("/music") ? "bg-accent" : ""}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>Music</span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <Link href="/music/setlists">
                  <DropdownMenuItem
                    className={pathname.startsWith("/music/setlists") ? "bg-accent" : ""}
                  >
                    <ListMusic className="mr-2 h-4 w-4" />
                    <span>Set Lists</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/music/songs">
                  <DropdownMenuItem
                    className={pathname.startsWith("/music/songs") ? "bg-accent" : ""}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    <span>Songs</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }

        return (
          <Link href={item.href} key={item.href}>
            <DropdownMenuItem
              className={
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-accent"
                  : ""
              }
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </Link>
        );
      });
  }

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });

      setIsLogoutAlertOpen(false);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  return (
    <>
      <DropdownMenu modal={true}>
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
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>

            <AlertDialogAction asChild>
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
