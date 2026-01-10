'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== '/login';

  return (
    <div className="relative flex min-h-screen flex-col">
      {showHeader && <Header />}
      <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
