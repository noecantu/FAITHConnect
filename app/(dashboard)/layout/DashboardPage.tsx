// app/(dashboard)/layout/DashboardPage.tsx
"use client";

interface DashboardPageProps {
  children: React.ReactNode;
}

export function DashboardPage({ children }: DashboardPageProps) {
  return (
    <div className="pt-10 pb-10 px-6 sm:px-8 md:px-12 lg:px-16">
      <div className="w-full space-y-6">
        {children}
      </div>
    </div>
  );
}
