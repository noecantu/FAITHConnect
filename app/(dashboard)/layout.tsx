// app/(dashboard)/layout.tsx
"use client";

import Header from '../components/layout/Header';
import { AppFooter } from '../components/layout/AppFooter';
import { DashboardPage } from './layout/DashboardPage';
import { ChurchDisabledGuard } from './layout/ChurchDisabledGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ChurchDisabledGuard />
      <Header />

      <div className="flex-1 flex flex-col">
        <DashboardPage>
          {children}
        </DashboardPage>
      </div>

      <AppFooter />
    </div>
  );
}
