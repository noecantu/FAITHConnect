//app/(dashboard)/admin/regional/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import { getUsersByChurchIds } from '@/app/lib/regional-users';
import Link from 'next/link';

type RegionalChurch = {
  id: string;
};

type RegionalUser = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  profilePhotoUrl?: string | null;
};

export default function RegionalUsersPage() {
  const { isRootAdmin, isRegionalAdmin, regionId, loading: permLoading } = usePermissions();
  const [churches, setChurches] = useState<RegionalChurch[]>([]);
  const [users, setUsers] = useState<RegionalUser[]>([]);
  const [churchesLoading, setChurchesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionId', '==', regionId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as RegionalChurch[];
        setChurches(list);
        setChurchesLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== 'permission-denied') console.error('regional churches snapshot error:', error);
        setChurchesLoading(false);
      }
    );

    return () => unsub();
  }, [regionId]);

  useEffect(() => {
    if (churchesLoading) return;

    const churchIds = churches.map((church) => church.id);

    if (churchIds.length === 0) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    let active = true;

    const loadUsers = async () => {
      setUsersLoading(true);

      try {
        const regionUsers = await getUsersByChurchIds(churchIds);
        if (!active) return;
        setUsers(regionUsers as RegionalUser[]);
      } catch (error) {
        console.error('regional users load error:', error);
        if (active) setUsers([]);
      } finally {
        if (active) setUsersLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [churches, churchesLoading]);

    // Block unauthorized access
    if (permLoading) {
      return (
        <div className="p-6 text-muted-foreground">
          Loading…
        </div>
      );
    }

    if (!isRegionalAdmin && !isRootAdmin) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      );
    }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Regional Users</h1>
        <p className="text-muted-foreground">
          Users belonging to churches in your region.
        </p>
      </div>

      {(churchesLoading || usersLoading) && (
        <div className="text-muted-foreground">Loading users…</div>
      )}

      {!churchesLoading && !usersLoading && users.length === 0 && (
        <div className="text-muted-foreground">
          No users found in your region.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <Link
            key={user.uid}
            href={`/admin/regional/users/${user.uid}`}
            className="group block"
          >
            <div
              className="
                h-full p-4 rounded-lg
                bg-black/40 backdrop-blur-xl
                interactive-card
              "
            >
              <div className="flex items-center gap-3">
                {user.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profilePhotoUrl}
                    alt={`${user.firstName ?? "User"} ${user.lastName ?? ""} profile photo`.trim()}
                    className="h-24 w-24 rounded-xl object-cover interactive-card-media"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl flex items-center justify-center bg-white/10 interactive-card-media text-sm font-semibold">
                    {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                Roles: {Array.isArray(user.roles) ? user.roles.join(', ') : 'None'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
