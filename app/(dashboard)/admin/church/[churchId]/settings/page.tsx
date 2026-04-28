'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAuth } from '@/app/hooks/useAuth';
import { can } from '@/app/lib/auth/permissions';
import type { Role } from '@/app/lib/auth/roles';

import type { AppUser } from '@/app/lib/types';
import { useUserManagement } from '@/app/hooks/useUserManagement';

import UserListCard from '@/app/components/settings/UserListCard';
import StorageUsageCard from '@/app/components/settings/StorageUsageCard';
import UserFormCard from '@/app/components/settings/UserFormCard';
import DeleteUserDialog from '@/app/components/settings/DeleteUserDialog';
import ChurchLogoCard from '@/app/components/settings/ChurchLogoCard';
import ChurchProfileCard from '@/app/components/settings/ChurchProfileCard';
import RegionMembershipCard from '@/app/components/settings/RegionMembershipCard';
import ChurchDataWarningsCard from '@/app/components/settings/ChurchDataWarningsCard';
import { ChangePasswordCard } from '@/app/components/settings/ChangePasswordCard';

export default function ChurchSettingsPage() {
  const { churchId: church_id } = useChurchId();
  const { user, loading: authLoading } = useAuth();

  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [billingOwnerUid, setBillingOwnerUid] = useState<string | null>(null);

  const fetchBillingOwner = useCallback(() => {
    if (!church_id) { setBillingOwnerUid(null); return; }
    fetch(`/api/church/${encodeURIComponent(church_id)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        const uid =
          typeof data.billing_owner_uid === 'string'
            ? data.billing_owner_uid
            : typeof data.created_by === 'string'
            ? data.created_by
            : null;
        setBillingOwnerUid(uid);
      })
      .catch(() => setBillingOwnerUid(null));
  }, [church_id]);

  const {
    users,
    loading: loadingUsers,

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
    isTransferringBillingOwner,

    handleRoleChange,
    handleCreateUser,
    handleSaveUser,
    handleDeleteUser,
    handleTransferBillingOwner,

    startCreate,
    startEdit,
    startConfirmDelete,
    goBackToList,

    getSortedUsers,
  } = useUserManagement(church_id ?? undefined, { onBillingOwnerTransferred: fetchBillingOwner });

  // ---------- BILLING OWNER ----------

  useEffect(() => {
    fetchBillingOwner();
  }, [fetchBillingOwner]);

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

  const sortedUsers = getSortedUsers(users).sort((a: AppUser, b: AppUser) => {
    const aIsBillingOwner = billingOwnerUid != null && a.uid === billingOwnerUid;
    const bIsBillingOwner = billingOwnerUid != null && b.uid === billingOwnerUid;

    if (aIsBillingOwner && !bIsBillingOwner) return -1;
    if (!aIsBillingOwner && bIsBillingOwner) return 1;
    return 0;
  });

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

  if (!can((user.roles ?? []) as Role[], 'church.manage')) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">
          You do not have permission to access church settings.
        </h1>
        <p className="text-muted-foreground mt-2">
          You need church management permission to manage church-level settings.
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
            billingOwnerUid={billingOwnerUid}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <ChurchLogoCard churchId={church_id!} churchName="" />

            <ChurchProfileCard church_id={church_id!} />

            <ChangePasswordCard />

            <RegionMembershipCard churchId={church_id!} />
          </div>

          <StorageUsageCard
            storageUsed={storageUsed}
            hasLoaded={hasLoadedUsage}
            refreshing={refreshing}
            onRefresh={fetchUsage}
          />

          <ChurchDataWarningsCard churchId={church_id!} />
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
          onDelete={startConfirmDelete}
          onTransferBillingOwner={handleTransferBillingOwner}
          onClose={goBackToList}
          isCreating={isCreating}
          isSaving={isSaving}
          isTransferringBillingOwner={isTransferringBillingOwner}
          isBillingOwner={selectedUser?.uid === billingOwnerUid}
          canTransferBillingOwner={Boolean(selectedUser?.roles?.includes('Admin' as Role))}
          currentUserId={user?.uid ?? ''}
          currentUserRoles={(user?.roles ?? []) as Role[]}
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

