"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { PageHeader } from "@/app/components/page-header";
import { ProfilePhotoCard } from "@/app/components/settings/ProfilePhotoCard";
import { ChangePasswordCard } from "@/app/components/settings/ChangePasswordCard";
import RegionProfileCard from "@/app/components/settings/RegionProfileCard";
import RegionLogoCard from "@/app/components/settings/RegionLogoCard";
import DistrictMembershipCard from "@/app/components/settings/DistrictMembershipCard";

export default function RegionalSettingsPage() {
  const supabase = getSupabaseClient();
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();
  const { user, loading: userLoading } = useCurrentUser();

  const [regionName, setRegionName] = useState("Region");

  useEffect(() => {
    if (!regionId) return;

    const load = async () => {
      const { data: regionData } = await supabase.from("regions").select('name').eq('id', regionId).single();
      if (!regionData) return;

      const name = (regionData.name as string | undefined) ?? "Region";
      setRegionName(name);
    };

    load();
  }, [regionId, supabase]);

  if (permLoading || userLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isRegionalAdmin || !regionId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-muted-foreground">Could not load user profile.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Regional Settings"
        subtitle="Manage region profile details, logo, and your regional admin account settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionProfileCard region_id={regionId} />
        <RegionLogoCard region_id={regionId} regionName={regionName} />
        <ProfilePhotoCard user={user} />
        <ChangePasswordCard />
      </div>

      <DistrictMembershipCard regionId={regionId} />
    </div>
  );
}
