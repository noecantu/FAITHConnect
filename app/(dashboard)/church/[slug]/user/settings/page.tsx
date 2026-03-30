'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

import { PageHeader } from "@/app/components/page-header";
import UserProfileCard from "@/app/components/settings/UserProfileCard";
import { ChangePasswordCard } from "@/app/components/settings/ChangePasswordCard";

import { Fab } from "@/app/components/ui/fab";
import { Save, Loader2, Check } from "lucide-react";
import { ProfilePhotoCard } from "@/app/components/settings/ProfilePhotoCard";

export default function UserSettingsPage() {
  //
  // 1. ALL HOOKS MUST BE HERE — NO RETURNS ABOVE THIS LINE
  //
  const { user: authUser, loading: authLoading } = useCurrentUser();

  const [fullUser, setFullUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dirty, setDirty] = useState({
    profile: false,
    calendar: false,
    contributions: false,
    password: false,
    photo: false,
  });

  const isDirty =
    dirty.profile ||
    dirty.calendar ||
    dirty.contributions ||
    dirty.password ||
    dirty.photo;

  const [isSaving, setIsSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const saveProfileRef = useRef<(() => Promise<void>) | null>(null);
  const saveCalendarRef = useRef<(() => Promise<void>) | null>(null);
  const saveContributionsRef = useRef<(() => Promise<void>) | null>(null);
  const savePasswordRef = useRef<(() => Promise<void>) | null>(null);
  const savePhotoRef = useRef<(() => Promise<void>) | null>(null);

  const handlePhotoDirty = useCallback((v: boolean) => {
    setDirty((d) => ({ ...d, photo: v }));
  }, []);

  const registerPhotoSave = useCallback((fn: () => Promise<void>) => {
    savePhotoRef.current = fn;
  }, []);

  const handleProfileDirty = useCallback((v: boolean) => {
    setDirty((d) => ({ ...d, profile: v }));
  }, []);

  const registerProfileSave = useCallback((fn: () => Promise<void>) => {
    saveProfileRef.current = fn;
  }, []);

  const handlePasswordDirty = useCallback((v: boolean) => {
    setDirty((d) => ({ ...d, password: v }));
  }, []);

  const registerPasswordSave = useCallback((fn: () => Promise<void>) => {
    savePasswordRef.current = fn;
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!isDirty) return;

    setIsSaving(true);

    const tasks: Array<Promise<void>> = [];

    if (dirty.profile && saveProfileRef.current) tasks.push(saveProfileRef.current());
    if (dirty.calendar && saveCalendarRef.current) tasks.push(saveCalendarRef.current());
    if (dirty.contributions && saveContributionsRef.current) tasks.push(saveContributionsRef.current());
    if (dirty.password && savePasswordRef.current) tasks.push(savePasswordRef.current());
    if (dirty.photo && savePhotoRef.current) tasks.push(savePhotoRef.current());

    await Promise.all(tasks);

    setIsSaving(false);
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 500);

    setDirty({
      profile: false,
      calendar: false,
      contributions: false,
      password: false,
      photo: false,
    });
  }, [dirty, isDirty]);

  //
  // 2. DATA LOADING EFFECT — STILL ABOVE ANY RETURN
  //
  useEffect(() => {
    if (authLoading || !authUser) return;

    const userId = authUser.id;

    async function load() {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      setFullUser(snap.data());
      setLoading(false);
    }

    load();
  }, [authUser, authLoading]);

  //
  // 3. NOW — AND ONLY NOW — YOU MAY RETURN CONDITIONALLY
  //
  if (!authUser) {
    return (
      <div className="p-6 text-slate-300">
        You must be logged in to view settings.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-none p-6 space-y-10">
        <PageHeader
          title="Settings"
          subtitle="Manage your personal account and preferences."
        />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  //
  // 4. FINAL RENDER
  //
  return (
    <div className="w-full max-w-none p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal account and preferences."
      />

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <UserProfileCard
          user={fullUser}
          onDirtyChange={handleProfileDirty}
          registerSave={registerProfileSave}
        />

        <ProfilePhotoCard
          user={fullUser}
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
          h-14 w-14 transition-all duration-300
          ${(!isDirty && !isSaving) ? "opacity-40" : "opacity-100"}
        `}
      >
        {isSaving && <Loader2 className="h-6 w-6 animate-spin" />}
        {!isSaving && showCheck && (
          <Check className="h-7 w-7 animate-pulse" />
        )}
        {!isSaving && !showCheck && <Save className="h-6 w-6" />}
      </Fab>
    </div>
  );
}
