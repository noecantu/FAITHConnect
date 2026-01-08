'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, DollarSign, Menu, Plus, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MemberFormSheet } from '@/app/members/member-form-sheet';

const navItems = [
  { href: '/', label: 'Members', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contributions', label: 'Contributions', icon: DollarSign },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label}>
            <DropdownMenuItem
              className={pathname === item.href ? 'bg-accent' : ''}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </Link>
        ))}
        <DropdownMenuSeparator />
         <MemberFormSheet>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Member</span>
            </DropdownMenuItem>
         </MemberFormSheet>
        <DropdownMenuSeparator />
        <Link href="/settings">
            <DropdownMenuItem
                className={pathname === '/settings' ? 'bg-accent' : ''}
            >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
