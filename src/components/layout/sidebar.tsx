'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, DollarSign, Menu, Plus, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
    <>
      {/* The dialog must live OUTSIDE the dropdown */}
      <MemberFormSheet>
        <div id="add-member-trigger" className="hidden" />
      </MemberFormSheet>

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
              <DropdownMenuItem className={pathname === item.href ? 'bg-accent' : ''}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            </Link>
          ))}

          <DropdownMenuSeparator />

          {/* FIX: This item now triggers the hidden dialog trigger */}
          <DropdownMenuItem
            onClick={() => {
              document.getElementById('add-member-trigger')?.click();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Member</span>
          </DropdownMenuItem>

          <Link href="/settings">
            <DropdownMenuItem className={pathname === '/settings' ? 'bg-accent' : ''}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}