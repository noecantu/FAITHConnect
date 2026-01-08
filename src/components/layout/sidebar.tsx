'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FaithConnectLogo } from '@/components/icons';
import { Users, Calendar, DollarSign, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { href: '/', label: 'Members', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contributions', label: 'Contributions', icon: DollarSign },
];

export default function Sidebar() {
  return (
    <>
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FaithConnectLogo className="h-6 w-6 text-primary" />
            <span>FAITH Connect</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLinks />
        </nav>
      </div>
    </>
  );
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <FaithConnectLogo className="h-6 w-6 text-primary" />
                        <span>FAITH Connect</span>
                    </Link>
                </div>
                <nav className="space-y-1 p-4">
                    <NavLinks />
                </nav>
            </SheetContent>
        </Sheet>
    )
}

function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => (
        <Link href={item.href} key={item.label}>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );
}
