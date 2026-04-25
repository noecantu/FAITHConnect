"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { PageHeader } from "@/app/components/page-header";
import { ProfilePhotoCard } from "@/app/components/settings/ProfilePhotoCard";
import { ChangePasswordCard } from "@/app/components/settings/ChangePasswordCard";
import DistrictProfileCard from "@/app/components/settings/DistrictProfileCard";
import DistrictLogoCard from "@/app/components/settings/DistrictLogoCard";
import { Fab } from "@/app/components/ui/fab";
import { Save, Loader2, Check } from "lucide-react";

export default function DistrictSettingsPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();
  const { user, loading: userLoading } = useCurrentUser();

  const [districtName, setDistrictName] = useState("District");
  const [dirty, setDirty] = useState({ photo: false, password: false });
  const [isSaving, setIsSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const savePasswordRef = useRef<(() => Promise<void>) | null>(null);
  const savePhotoRef = useRef<(() => Promise<void>) | null>(null);

  const isDirty = dirty.photo || dirty.password;

  const handlePhotoDirty = useCallback((v: boolean) => {
    setDirty((d) => ({ ...d, photo: v }));
  }, []);

  const handlePasswordDirty = useCallback((v: boolean) => {
    setDirty((d) => ({ ...d, password: v }));
  }, []);

  const registerPhotoSave = useCallback((fn: () => Promise<void>) => {
    savePhotoRef.current = fn;
  }, []);

  const registerPasswordSave = useCallback((fn: () => Promise<void>) => {
    savePasswordRef.current = fn;
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!isDirty) return;

    setIsSaving(true);

    const tasks: Array<Promise<void>> = [];

    if (dirty.photo && savePhotoRef.current) tasks.push(savePhotoRef.current());
    if (dirty.password && savePasswordRef.current) tasks.push(savePasswordRef.current());

    await Promise.all(tasks);

    setIsSaving(false);
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 500);

    setDirty({ photo: false, password: false });
  }, [dirty, isDirty]);

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
        <DistrictProfileCard districtId={districtId} />
        <DistrictLogoCard districtId={districtId} districtName={districtName} />
        <ProfilePhotoCard
          user={user}
          onDirtyChange={handlePhotoDirty}
          registerSave={registerPhotoSave}
        />
        <ChangePasswordCard
          onDirtyChange={handlePasswordDirty}
          registerSave={registerPasswordSave}
        />
      </div>

      <Fab
        type="save"
        onClick={handleSaveAll}
        disabled={!isDirty && !isSaving}
        className={`
          h-14 w-14 transition-all duration-500
          ${(!isDirty && !isSaving) ? "opacity-40" : "opacity-100"}
        `}
      >
        {isSaving && <Loader2 className="h-6 w-6 animate-spin" />}
        {!isSaving && showCheck && <Check className="h-7 w-7 animate-pulse" />}
        {!isSaving && !showCheck && <Save className="h-6 w-6" />}
      </Fab>
    </div>
  );
}
