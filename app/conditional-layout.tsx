'use client';

import { usePathname } from 'next/navigation';
import Header from './components/layout/Header';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeader =
  pathname === '/login' ||
  pathname.includes('/attendance/self-checkin') ||
  pathname.includes('/signup') ||
  pathname.includes('/onboarding/create-church');

  if (hideHeader) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
