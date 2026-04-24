'use client';

import ReportsPage from '@/app/(dashboard)/church/[slug]/reports/page';
import { usePermissions } from '@/app/hooks/usePermissions';

export default function AdminReportsPage() {
  const { loading, isDistrictAdmin, isRegionalAdmin } = usePermissions();

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading reports…</div>;
  }

  if (!isDistrictAdmin && !isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <ReportsPage />;
}
