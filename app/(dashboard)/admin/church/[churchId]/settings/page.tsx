'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAuth } from '@/app/hooks/useAuth';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';

import type { AppUser } from '@/app/lib/types';
import { useUserManagement } from '@/app/hooks/useUserManagement';

import UserListCard from '@/app/components/settings/UserListCard';
import StorageUsageCard from '@/app/components/settings/StorageUsageCard';
import UserFormCard from '@/app/components/settings/UserFormCard';
import DeleteUserDialog from '@/app/components/settings/DeleteUserDialog';
import ChurchLogoCard from '@/app/components/settings/ChurchLogoCard';
import ChurchProfileCard from '@/app/components/settings/ChurchProfileCard';

const SYSTEM_ROLES = [
  'RootAdmin',
  'SystemAdmin',
  'RegionalAdmin',
  'Support',
  'Auditor',
] as const;

function isSystemUser(roles: string[]) {
  return roles?.some((r) => SYSTEM_ROLES.includes(r as any));
}

export default function ChurchSettingsPage() {
  const { churchId } = useChurchId();
  const { user, loading: authLoading } = useAuth();

  const [churchName] = useState('');

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    mode,
    selectedUser,
    firstName,
    lastName,
    email,
    password,
    selectedRoles,
    regionName,

    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    setRegionName,

    isCreating,
    isSaving,
    isDeleting,

    handleRoleChange,
    handleCreateUser,
    handleSaveUser,
    handleDeleteUser,

    startCreate,
    startEdit,
    goBackToList,

    getSortedUsers,
  } = useUserManagement();

  // ---------- USERS LIST SUBSCRIPTION ----------

  useEffect(() => {
    if (!churchId || !user?.uid) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('churchId', '==', churchId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          ...(d.data() as AppUser),
          uid: d.id,
        }));
        setUsers(list);
        setLoadingUsers(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('listenToUsers error:', error);
        }
        setLoadingUsers(false);
      }
    );

    return () => unsub();
  }, [churchId, user?.uid]);

  // ---------- STORAGE USAGE ----------

  const fetchUsage = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/storage-usage');
      const data = await res.json();
      setStorageUsed(data.storageUsed);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setStorageUsed(null);
    } finally {
      setHasLoadedUsage(true);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const sortedUsers = getSortedUsers(users);

  // ---------- AUTH + LOADING GATES (AFTER ALL HOOKS) ----------

  if (authLoading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">
          You must be logged in to access this page.
        </h1>
      </div>
    );
  }

  if (isSystemUser(user.roles ?? [])) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">
          You do not have permission to access church settings.
        </h1>
        <p className="text-muted-foreground mt-2">
          System-level accounts cannot manage church-level settings.
        </p>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  // ---------- MAIN RENDER ----------

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage settings for your organization."
        className="mb-2"
      />

      {mode === 'list' && (
        <>
          <UserListCard
            users={sortedUsers}
            onCreate={startCreate}
            onSelectUser={startEdit}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <ChurchLogoCard churchId={churchId!} churchName={churchName} />

            <ChurchProfileCard churchId={churchId!} />
          </div>

          <StorageUsageCard
            storageUsed={storageUsed}
            hasLoaded={hasLoadedUsage}
            refreshing={refreshing}
            onRefresh={fetchUsage}
          />
        </>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <UserFormCard
          mode={mode}
          firstName={firstName}
          lastName={lastName}
          email={email}
          password={password}
          selectedRoles={selectedRoles}
          regionName={regionName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setEmail={setEmail}
          setPassword={setPassword}
          setRegionName={setRegionName}
          onRoleChange={handleRoleChange}
          onCreate={handleCreateUser}
          onSave={handleSaveUser}
          onDelete={() => {}}
          onClose={goBackToList}
          isCreating={isCreating}
          isSaving={isSaving}
          currentUserId={user?.uid ?? ''}
          currentUserRoles={user?.roles ?? []}
          targetUserId={selectedUser?.uid}
        />
      )}

      {mode === 'confirm-delete' && selectedUser && (
        <DeleteUserDialog
          user={selectedUser}
          onCancel={goBackToList}
          onConfirm={handleDeleteUser}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
