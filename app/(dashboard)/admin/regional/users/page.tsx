//app/(dashboard)/admin/regional/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PageHeader } from '@/app/components/page-header';
import Link from 'next/link';

type RegionalUser = {
  uid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  roles?: string[];
  profile_photo_url?: string | null;
};

export default function RegionalUsersPage() {
  const { isRootAdmin, isRegionalAdmin, regionId, loading: permLoading } = usePermissions();
  const [users, setUsers] = useState<RegionalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regionId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/region/users?regionId=${encodeURIComponent(regionId)}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to load regional users (${res.status})`);
        }

        const body = await res.json();

        if (!active) return;
        setUsers(Array.isArray(body?.users) ? body.users : []);
      } catch (error) {
        console.error('regional users load error:', error);
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [regionId]);

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
      <PageHeader
        title="Regional Users"
        subtitle="User accounts belonging to churches in your region."
      />

      {loading && (
        <div className="text-muted-foreground">Loading users…</div>
      )}

      {!loading && users.length === 0 && (
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
                {user.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile_photo_url}
                    alt={`${user.first_name ?? "User"} ${user.last_name ?? ""} profile photo`.trim()}
                    className="h-24 w-24 rounded-xl object-cover interactive-card-media"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl flex items-center justify-center bg-white/10 interactive-card-media text-sm font-semibold">
                    {`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">
                    {user.first_name} {user.last_name}
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
