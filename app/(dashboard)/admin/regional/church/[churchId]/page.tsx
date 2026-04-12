//app/(dashboard)/admin/regional/church/[churchId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import Link from 'next/link';

export default function RegionalChurchDetailPage() {
  const { churchId } = useParams();
  const { isRootAdmin, isRegionalAdmin, regionId } = usePermissions();

  const [church, setChurch] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Unauthorized access
  if (!isRegionalAdmin && !isRootAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Load church
  useEffect(() => {
    async function loadChurch() {
      const ref = doc(db, 'churches', churchId as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setChurch(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Block cross‑region access
      if (data.regionId !== regionId) {
        setChurch(null);
        setLoading(false);
        return;
      }

      setChurch({ id: snap.id, ...data });
      setLoading(false);
    }

    loadChurch();
  }, [churchId, regionId]);

  // Load users in this church
  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'users'),
      where('churchId', '==', churchId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });

    return () => unsub();
  }, [churchId]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading church…</div>;
  }

  if (!church) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Church Not Found</h1>
        <p>This church does not exist or is not in your region.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{church.name}</h1>
        <p className="text-muted-foreground">
          Church details and users in your region.
        </p>
      </div>

      {/* Church Profile */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-2">Church Profile</h2>

        <p><strong>Address:</strong> {church.address || 'N/A'}</p>
        <p><strong>Phone:</strong> {church.phone || 'N/A'}</p>
        <p><strong>Timezone:</strong> {church.timezone || 'N/A'}</p>
        <p><strong>Region:</strong> {church.regionId || 'N/A'}</p>
      </div>

      {/* Logo */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-2">Church Logo</h2>

        {church.logoUrl ? (
          <img
            src={church.logoUrl}
            alt="Church Logo"
            className="h-24 object-contain"
          />
        ) : (
          <p className="text-muted-foreground">No logo uploaded.</p>
        )}
      </div>

      {/* Users */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-4">Users</h2>

        {users.length === 0 && (
          <p className="text-muted-foreground">No users found.</p>
        )}

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-black/20"
            >
              <div>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
                <Link
                  href={`/admin/regional/users/${user.id}`}
                  className="
                    px-3 py-1.5 rounded-md border
                    bg-muted/20 hover:bg-muted transition
                    text-sm
                  "
                >
                  View
                </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}