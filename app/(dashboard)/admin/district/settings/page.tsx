"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { PageHeader } from "@/app/components/page-header";
import { ProfilePhotoCard } from "@/app/components/settings/ProfilePhotoCard";
import { ChangePasswordCard } from "@/app/components/settings/ChangePasswordCard";
import DistrictProfileCard from "@/app/components/settings/DistrictProfileCard";
import DistrictLogoCard from "@/app/components/settings/DistrictLogoCard";

export default function DistrictSettingsPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();
  const { user, loading: userLoading } = useCurrentUser();

  const [districtName, setDistrictName] = useState("District");

  useEffect(() => {
    if (!districtId) return;

    const load = async () => {
      const { data } = await getSupabaseClient()
        .from("districts")
        .select("name")
        .eq("id", districtId)
        .single();
      if (!data) return;

      const name = (data.name as string | undefined) ?? "District";
      setDistrictName(name);
    };

    load();
  }, [districtId]);

  if (permLoading || userLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isDistrictAdmin || !districtId) {
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
        title="District Settings"
        subtitle="Manage district profile details, logo, and your district admin account settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistrictProfileCard district_id={districtId} />
        <ChangePasswordCard />
        <DistrictLogoCard districtId={districtId} districtName={districtName} />
        <ProfilePhotoCard user={user} />
      </div>
    </div>
  );
}
