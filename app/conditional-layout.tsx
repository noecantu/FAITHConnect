'use client';

import { usePathname } from 'next/navigation';
import Header from './components/layout/Header';
import { AppFooter } from './components/layout/AppFooter';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeaderAndFooter =
    pathname === '/login' ||
    pathname.includes('/check-in') ||
    pathname.includes('/signup') ||
    pathname.includes('/onboarding/create-church') ||
    pathname.includes('/member-portal-login') ||
    pathname.startsWith('/member-portal') ||
    pathname.startsWith('/marketing');

  if (hideHeaderAndFooter) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <Header />
      <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
