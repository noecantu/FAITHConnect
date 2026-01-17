'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, DollarSign, Menu, Settings, LogOut, FileText } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useChurchId } from '@/hooks/useChurchId';

const navItems = [
  { href: '/', label: 'Members', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contributions', label: 'Contributions', icon: DollarSign },
];

export function NavMenu({ setReportType }: { setReportType: (type: 'members' | 'contributions') => void }) {
  const pathname = usePathname();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const { toast } = useToast();
  const churchId = useChurchId();
  const { isAdmin } = useUserRoles(churchId);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLogoutAlertOpen(false);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

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
          {navItems.map((item) => (
            <Link href={item.href} key={item.label}>
              <DropdownMenuItem className={pathname === item.href ? 'bg-accent' : ''}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            </Link>
          ))}

          {isAdmin && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileText className="mr-2 h-4 w-4" />
                <span>Reports</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setReportType('contributions')}>
                  Contribution Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReportType('members')}>
                  Member Report
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />

          <Link href="/settings">
            <DropdownMenuItem className={pathname === '/settings' ? 'bg-accent' : ''}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          
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
