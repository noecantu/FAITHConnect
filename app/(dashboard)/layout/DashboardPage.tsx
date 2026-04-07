"use client";

interface DashboardPageProps {
  children: React.ReactNode;
}

export function DashboardPage({ children }: DashboardPageProps) {
  return (
    <div className="pt-12 px-6 md:px-10 space-y-6">
      {children}
    </div>
  );
}