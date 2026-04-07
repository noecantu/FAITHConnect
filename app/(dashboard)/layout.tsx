// app/(dashboard)/layout.tsx
"use client";

import Header from '../components/layout/Header';
import { AppFooter } from '../components/layout/AppFooter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <AppFooter />
    </>
  );
}
