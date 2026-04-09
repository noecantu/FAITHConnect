// app/(dashboard)/layout/DashboardPage.tsx
"use client";

interface DashboardPageProps {
  children: React.ReactNode;
}

export function DashboardPage({ children }: DashboardPageProps) {
  return (
    <div className="pt-10 pb-10 px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
