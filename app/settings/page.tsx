'use client';

import { PageHeader } from "@/app/components/page-header";
import { CalendarPreferencesCard } from "@/app/components/settings/CalendarPreferencesCard";
import UserProfileCard from "@/app/components/settings/UserProfileCard";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal account and preferences."
      />

      <UserProfileCard />

      {user?.id && (
        <CalendarPreferencesCard userId={user.id} />
      )}
    </div>
  );
}
