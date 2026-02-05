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
} from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

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

const navItems = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/contributions", label: "Contributions", icon: DollarSign },
  { href: "/music", label: "Music", icon: Music },
  { href: "/service-plan", label: "Service Plans", icon: CalendarHeart },
];

export function NavMenu() {
  const pathname = usePathname();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const { toast } = useToast();
  const churchId = useChurchId();

  const { roles, isAdmin, isMusicManager, isMusicMember } = useUserRoles(churchId);

  const canSeeContributions = isAdmin || roles.includes("Finance");
  const canAccessMusic = isAdmin || isMusicManager || isMusicMember;
  const canAccessServicePlan = isAdmin || roles.includes("Pastor");
  const canSeeSettings = isAdmin;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLogoutAlertOpen(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };
console.log("roles from hook:", roles);
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
          {/* Dashboard Link (Root Admin or Church Admin) */}
          {roles.includes("RootAdmin") && (
            <Link href="/admin">
              <DropdownMenuItem
                className={pathname === "/admin" ? "bg-accent" : ""}
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </Link>
          )}

          {!roles.includes("RootAdmin") && isAdmin && churchId && (
            <Link href={`/admin/church/${churchId}`}>
              <DropdownMenuItem
                className={
                  pathname.startsWith(`/admin/church/${churchId}`)
                    ? "bg-accent"
                    : ""
                }
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </Link>
          )}

          {/* Core Navigation (hidden for Root Admin) */}
          {!roles.includes("RootAdmin") && (
            <>
              {navItems
                .filter((item) => {
                  if (item.href === "/contributions") return canSeeContributions;
                  if (item.href === "/music") return canAccessMusic;
                  if (item.href === "/service-plan") return canAccessServicePlan;
                  return true;
                })
                .map((item) => {
                  if (item.href === "/music") {
                    return (
                      <DropdownMenuSub key="music">
                        <DropdownMenuSubTrigger
                          className={
                            pathname.startsWith("/music") ? "bg-accent" : ""
                          }
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>Music</span>
                        </DropdownMenuSubTrigger>

                        <DropdownMenuSubContent>
                          <Link href="/music/songs">
                            <DropdownMenuItem
                              className={
                                pathname.startsWith("/music/songs")
                                  ? "bg-accent"
                                  : ""
                              }
                            >
                              <Music className="mr-2 h-4 w-4" />
                              <span>Songs</span>
                            </DropdownMenuItem>
                          </Link>

                          <Link href="/music/setlists">
                            <DropdownMenuItem
                              className={
                                pathname.startsWith("/music/setlists")
                                  ? "bg-accent"
                                  : ""
                              }
                            >
                              <ListMusic className="mr-2 h-4 w-4" />
                              <span>Set Lists</span>
                            </DropdownMenuItem>
                          </Link>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  }

                  return (
                    <Link href={item.href} key={item.label}>
                      <DropdownMenuItem
                        className={
                          pathname === item.href ||
                          pathname.startsWith(item.href + "/")
                            ? "bg-accent"
                            : ""
                        }
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
            </>
          )}

          {/* Reports (Admin Only) */}
          {isAdmin && (
            <Link href="/reports">
              <DropdownMenuItem
                className={pathname === "/reports" ? "bg-accent" : ""}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Reports</span>
              </DropdownMenuItem>
            </Link>
          )}

          <DropdownMenuSeparator />

          {/* Settings */}
          {canSeeSettings && (
            <Link href="/settings">
              <DropdownMenuItem
                className={pathname === "/settings" ? "bg-accent" : ""}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
          )}

          {/* Logout */}
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
