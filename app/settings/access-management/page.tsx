'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useToast } from '@/app/hooks/use-toast';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAuth } from '@/app/hooks/useAuth';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

import type { User } from '@/app/lib/types';
import { useUserManagement } from '@/app/hooks/useUserManagement';

import UserListCard from './components/UserListCard';
import StorageUsageCard from './components/StorageUsageCard';
import UserFormCard from './components/UserFormCard';
import DeleteUserDialog from './components/DeleteUserDialog';

export default function AccessManagementPage() {
  const churchId = useChurchId();
  const { user } = useAuth();
  const { toast } = useToast();

  // -----------------------------
  // USERS LIST
  // -----------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // STORAGE USAGE
  // -----------------------------
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false);

  // -----------------------------
  // USER MANAGEMENT HOOK
  // -----------------------------
  const {
    mode,
    selectedUser,
    firstName,
    lastName,
    email,
    password,
    selectedRoles,

    setFirstName,
    setLastName,
    setEmail,
    setPassword,

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
  } = useUserManagement(churchId);

  // -----------------------------
  // LOAD USERS
  // -----------------------------
  useEffect(() => {
    if (!churchId || !user?.id) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('churchId', '==', churchId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          ...(d.data() as User),
          id: d.id,
        }));
        setUsers(list);
        setLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('listenToUsers error:', error);
        }
      }
    );

    return () => unsub();
  }, [churchId, user?.id]);

  // -----------------------------
  // LOAD STORAGE USAGE
  // -----------------------------
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("https://getfirestoreusage-nn2kyrzdaa-uc.a.run.app");
        const data = await res.json();
        setStorageUsed(data.usageBytes);
      } catch (err) {
        console.error("Error fetching usage:", err);
        setStorageUsed(null);
      } finally {
        setHasLoadedUsage(true);
      }
    };

    fetchUsage();
  }, []);

  // -----------------------------
  // SORT USERS
  // -----------------------------
  const sortedUsers = getSortedUsers(users);

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage settings for your organization."
        className="mb-2"
      />

      {/* LIST MODE */}
      {mode === 'list' && (
        <>
          <UserListCard
            users={sortedUsers}
            onCreate={startCreate}
            onSelectUser={startEdit}
          />

          <StorageUsageCard
            storageUsed={storageUsed}
            hasLoaded={hasLoadedUsage}
          />
        </>
      )}

      {/* CREATE / EDIT FORM */}
      {(mode === 'create' || mode === 'edit') && (
        <UserFormCard
          mode={mode}
          firstName={firstName}
          lastName={lastName}
          email={email}
          password={password}
          selectedRoles={selectedRoles}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setEmail={setEmail}
          setPassword={setPassword}
          onRoleChange={handleRoleChange}
          onCreate={handleCreateUser}
          onSave={handleSaveUser}
          onDelete={() => {}}
          onClose={goBackToList}
          isCreating={isCreating}
          isSaving={isSaving}
        />
      )}

      {/* DELETE CONFIRMATION */}
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
