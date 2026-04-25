'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
;
import { getSupabaseClient } from "@/app/lib/supabase/client";
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
  const supabase = getSupabaseClient();
  const { userId } = useParams();
  const { isRootAdmin, isRegionalAdmin, region_id, loading: permLoading } = usePermissions();

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
        const church_id = typeof data.church_id === 'string' ? data.church_id : null;

        if (!church_id) {
          setUser(null);
          setLoading(false);
          return;
        }

        const churchSnap = await supabase.from('churches').select('*').eq('id', church_id).single();
        const churchRegionId = churchSnap.exists() ? churchSnap.data().region_id : null;

        if (churchRegionId !== region_id) {
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
  }, [userId, region_id, isRootAdmin]);

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
          {user.last_name}, {user.first_name}
        </h1>
        <p className="text-muted-foreground">User details in your region.</p>
      </div>

      {/* Profile Card */}
      {user.church_id ? (
        <Link href={`/admin/regional/church/${user.church_id}`} className="group block">
          <Card className="flex flex-col overflow-hidden bg-black/80 backdrop-blur-xl max-w-sm interactive-card">
            {/* Photo Section */}
            <div className="relative aspect-video w-full flex items-center justify-center bg-muted text-muted-foreground overflow-hidden">
          {user.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_photo_url}
              alt={`${user.first_name ?? "User"} ${user.last_name ?? ""} profile photo`.trim()}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <div className="text-center">
                <div className="text-4xl font-semibold text-foreground/30">
                  {`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardHeader className="pb-1 pt-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {user.first_name} {user.last_name}
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
          {user.church_id && (
            <div>
              <p className="text-muted-foreground mb-2">Church</p>
              <p className="text-foreground">
                {church?.name || user.church_id}
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
            {user.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_photo_url}
                alt={`${user.first_name ?? "User"} ${user.last_name ?? ""} profile photo`.trim()}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <div className="text-center">
                  <div className="text-4xl font-semibold text-foreground/30">
                    {`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <CardHeader className="pb-1 pt-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {user.first_name} {user.last_name}
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
