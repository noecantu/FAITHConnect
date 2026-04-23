'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Link from 'next/link';

export default function RegionalUserDetailPage() {
  const { userId } = useParams();
  const { isRootAdmin, isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [user, setUser] = useState<any | null>(null);
  const [church, setChurch] = useState<any | null>(null);
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
      if (!isRootAdmin) {
        const churchId = typeof data.churchId === 'string' ? data.churchId : null;

        if (!churchId) {
          setUser(null);
          setLoading(false);
          return;
        }

        const churchSnap = await getDoc(doc(db, 'churches', churchId));
        const churchRegionId = churchSnap.exists() ? churchSnap.data().regionId : null;

        if (churchRegionId !== regionId) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (churchSnap.exists()) {
          setChurch(churchSnap.data());
        }
      }

      setUser({ ...data, uid: snap.id });
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
    <div className="p-3 space-y-3">
      <div>
        <h1 className="text-xl font-semibold">
          {user.lastName}, {user.firstName}
        </h1>
        <p className="text-muted-foreground">User details in your region.</p>
      </div>

      {/* Profile Card */}
      {user.churchId ? (
        <Link href={`/admin/regional/church/${user.churchId}`} className="group block">
          <Card className="flex flex-col overflow-hidden bg-black/80 backdrop-blur-xl max-w-sm interactive-card">
            {/* Photo Section */}
            <div className="relative aspect-video w-full flex items-center justify-center bg-muted text-muted-foreground overflow-hidden">
          {user.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePhotoUrl}
              alt={`${user.firstName ?? "User"} ${user.lastName ?? ""} profile photo`.trim()}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <div className="text-center">
                <div className="text-4xl font-semibold text-foreground/30">
                  {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardHeader className="pb-1 pt-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {user.firstName} {user.lastName}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-1 text-xs px-3 pb-2">
          {/* Email */}
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="text-primary">{user.email || 'N/A'}</p>
          </div>

          {/* Roles */}
          <div>
            <p className="text-muted-foreground mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(user.roles) && user.roles.length > 0 ? (
                user.roles.map((role: string) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">None</p>
              )}
            </div>
          </div>

          {/* Church */}
          {user.churchId && (
            <div>
              <p className="text-muted-foreground mb-2">Church</p>
              <p className="text-foreground">
                {church?.name || user.churchId}
              </p>
            </div>
          )}

          {/* Region Info */}
          <div>
            <p className="text-muted-foreground">Region Access</p>
            <p className="text-foreground">Verified by church assignment</p>
          </div>
        </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="flex flex-col overflow-hidden bg-black/80 border-white/15 backdrop-blur-xl max-w-sm">
          {/* Photo Section */}
          <div className="relative aspect-video w-full flex items-center justify-center bg-muted text-muted-foreground overflow-hidden">
            {user.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePhotoUrl}
                alt={`${user.firstName ?? "User"} ${user.lastName ?? ""} profile photo`.trim()}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <div className="text-center">
                  <div className="text-4xl font-semibold text-foreground/30">
                    {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <CardHeader className="pb-1 pt-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {user.firstName} {user.lastName}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-1 text-xs px-3 pb-2">
            {/* Email */}
            <div>
              <p className="text-muted-foreground">Email</p>
              <a
                href={`mailto:${user.email}`}
                className="text-primary hover:underline"
              >
                {user.email || 'N/A'}
              </a>
            </div>

            {/* Roles */}
            <div>
              <p className="text-muted-foreground mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(user.roles) && user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
            </div>

            {/* Region Info */}
            <div>
              <p className="text-muted-foreground">Region Access</p>
              <p className="text-foreground">Verified by church assignment</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
