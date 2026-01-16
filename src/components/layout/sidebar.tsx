'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, DollarSign, Menu, Settings, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Members', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contributions', label: 'Contributions', icon: DollarSign },
];

type NavMenuProps = {
  setIsLogoutAlertOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function NavMenu({ setIsLogoutAlertOpen }: NavMenuProps) {
  const pathname = usePathname();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {navItems.map((item) => (
          <DropdownMenuItem asChild key={item.href}>
            <Link
              href={item.href}
              className={pathname === item.href ? 'bg-accent' : ''}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className={pathname === '/settings' ? 'bg-accent' : ''}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          onSelect={(e) => {
            e.preventDefault();
            setIsLogoutAlertOpen(true);
          }}
        >
          <button className="flex w-full items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
