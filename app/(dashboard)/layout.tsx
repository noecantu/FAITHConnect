// app/(dashboard)/layout.tsx
"use client";

import Header from '../components/layout/Header';
import { AppFooter } from '../components/layout/AppFooter';
import { DashboardPage } from './layout/DashboardPage';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <Header />
        <DashboardPage>
          {children}
        </DashboardPage>
      <AppFooter />
    </>
  );
}