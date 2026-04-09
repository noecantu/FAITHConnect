//app/(dashboard)/layout/DashboardPage.tsx
"use client";

interface DashboardPageProps {
  children: React.ReactNode;
}

export function DashboardPage({ children }: DashboardPageProps) {
  return (
    <div className="pt-6 px-6 md:px-10 max-w-6xl mx-auto space-y-6">
      {children}
    </div>
  );
}