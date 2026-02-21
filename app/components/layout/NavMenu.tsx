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
import { auth } from "@/app/lib/firebase-client";

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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { useUserRoles } from "../../hooks/useUserRoles";
import { useChurchId } from "../../hooks/useChurchId";

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
  const { roles = [], isAdmin, isMusicManager, isMusicMember } = useUserRoles(churchId);

  // Hide NavMenu during onboarding (AFTER hooks)
  const isOnboarding = pathname.startsWith("/onboarding");
  if (isOnboarding) {
    return null;
  }
  
  // --- ROLE MODEL ---
  const isRootAdmin = roles.includes("RootAdmin");
  const isChurchAdmin = roles.includes("Admin") && churchId;

  // --- PERMISSIONS ---
  const canSeeContributions = isAdmin || roles.includes("Finance");
  const canAccessMusic = isAdmin || isMusicManager || isMusicMember;
  const canAccessServicePlan = isAdmin || roles.includes("Pastor");
  const canSeeAttendance =
    isAdmin || roles.includes("MemberManager") || roles.includes("AttendanceManager");

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
    { href: "/members", label: "Members", icon: Users },
    { href: "/music", label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
    { href: "/service-plan", label: "Service Plans", icon: CalendarHeart, permission: canAccessServicePlan },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/settings/access-management", label: "Settings", icon: Settings },
  ];

  const userMenu = [
    { href: `/church/${churchId}/user`, label: "Dashboard", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/music", label: "Music", icon: Music, permission: canAccessMusic, isSubmenu: true },
  ];

  // --- ACTIVE MENU ---
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
      // MUSIC SUBMENU
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
              <Link href="/music/songs">
                <DropdownMenuItem
                  className={pathname.startsWith("/music/songs") ? "bg-accent" : ""}
                >
                  <Music className="mr-2 h-4 w-4" />
                  <span>Songs</span>
                </DropdownMenuItem>
              </Link>

              <Link href="/music/setlists">
                <DropdownMenuItem
                  className={pathname.startsWith("/music/setlists") ? "bg-accent" : ""}
                >
                  <ListMusic className="mr-2 h-4 w-4" />
                  <span>Set Lists</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      // NORMAL ITEM
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
        variant: "destructive",
      });
    }
  };

  // --- UI ---
  return (
    <>
      <DropdownMenu modal={false}>
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

      {/* Logout Confirmation */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
