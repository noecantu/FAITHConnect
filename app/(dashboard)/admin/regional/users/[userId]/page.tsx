'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import Link from 'next/link';

export default function RegionalUserDetailPage() {
  const { userId } = useParams();
  const { isRootAdmin, isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const ref = doc(db, 'users', userId as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Block cross‑region access
      if (!isRootAdmin && data.regionId !== regionId) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({ id: snap.id, ...data });
      setLoading(false);
    }

    loadUser();
  }, [userId, regionId, isRootAdmin]);

  if (permLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

    // Unauthorized
  if (!isRegionalAdmin && !isRootAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  
  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading user…</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">User Not Found</h1>
        <p>This user does not exist or is not in your region.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-muted-foreground">User details in your region.</p>
      </div>

      {/* Profile */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl space-y-2">
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>Roles:</strong> {Array.isArray(user.roles) ? user.roles.join(', ') : 'None'}</p>
        <p><strong>Region:</strong> {user.regionId || 'N/A'}</p>
        <p><strong>Church:</strong> {user.churchId || 'N/A'}</p>

        {user.churchId && (
          <Link
            href={`/admin/regional/church/${user.churchId}`}
            className="inline-block mt-3 text-sm text-primary hover:underline"
          >
            View Church →
          </Link>
        )}
      </div>
    </div>
  );
}
