'use client';

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

import { PageHeader } from "@/app/components/page-header";
import UserProfileCard from "@/app/components/settings/UserProfileCard";
import { CalendarPreferencesCard } from "@/app/components/settings/CalendarPreferencesCard";
import { ContributionPreferencesCard } from "@/app/components/settings/ContributionPreferencesCard";

export default function UserSettingsPage() {
  const { user: authUser, loading: authLoading } = useCurrentUser();
  const [fullUser, setFullUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !authUser) return;

    const userId = authUser.id; // ← capture the narrowed value here

    async function load() {
      const ref = doc(db, "users", userId); // ← now ALWAYS a string
      const snap = await getDoc(ref);
      setFullUser(snap.data());
      setLoading(false);
    }

    load();
  }, [authUser, authLoading]);

  if (!authUser) {
    return (
      <div className="p-6 text-slate-300">
        You must be logged in to view settings.
      </div>
    );
  }

  // *** THIS IS THE FIX ***
  const userId = authUser.id;

  if (loading) {
    return (
      <div className="w-full max-w-none p-6 space-y-10">
        <PageHeader title="Settings" subtitle="Manage your personal account and preferences." />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none p-6 space-y-10">
      <PageHeader title="Settings" subtitle="Manage your personal account and preferences." />

      <UserProfileCard user={fullUser} />

      <CalendarPreferencesCard userId={userId} />

      <ContributionPreferencesCard userId={userId} churchId={fullUser.churchId}/>
    </div>
  );
}

