import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { AppUser, Mode } from '@/app/lib/types';
import type { Role } from '@/app/lib/auth/roles';

export function useUserManagement(churchId: string | undefined) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form / navigation state
  const [mode, setMode] = useState<Mode>('list');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [regionName, setRegionName] = useState('');

  // Async flags
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferringBillingOwner, setIsTransferringBillingOwner] = useState(false);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    if (!churchId) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("church_id", churchId);
    if (!error) {
      // Normalize: Supabase rows use snake_case, map to AppUser camelCase shape
      setUsers(
        (data || []).map((row: Record<string, unknown>) => ({
          uid: row.id as string,
          email: row.email as string,
          firstName: row.first_name as string | null,
          lastName: row.last_name as string | null,
          roles: (row.roles as Role[]) ?? [],
          churchId: row.church_id as string | null,
          regionId: row.region_id as string | null,
          districtId: row.district_id as string | null,
          managedChurchIds: (row.managed_church_ids as string[]) ?? [],
          profilePhotoUrl: row.profile_photo_url as string | undefined,
          settings: row.settings as AppUser['settings'],
        }))
      );
    }
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  // Navigation helpers
  const startCreate = () => {
    setSelectedUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
    setRegionName('');
    setMode('create');
  };

  const startEdit = (u: AppUser) => {
    setSelectedUser(u);
    setFirstName(u.firstName ?? '');
    setLastName(u.lastName ?? '');
    setEmail(u.email ?? '');
    setPassword('');
    setSelectedRoles((u.roles ?? []) as Role[]);
    setRegionName('');
    setMode('edit');
  };

  const startConfirmDelete = () => setMode('confirm-delete');
  const goBackToList = () => setMode('list');

  const handleRoleChange = (role: Role, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role)
    );
  };

  const handleCreateUser = async () => {
    if (!churchId) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/church-users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, firstName, lastName, email, password, roles: selectedRoles }),
      });
      if (res.ok) {
        await fetchUsers();
        goBackToList();
      } else {
        const body = await res.json().catch(() => ({}));
        console.error('Create user failed:', body.error ?? res.status);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser?.uid || !churchId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/church-users/${selectedUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, firstName, lastName, roles: selectedRoles }),
      });
      if (res.ok) {
        await fetchUsers();
        goBackToList();
      } else {
        const body = await res.json().catch(() => ({}));
        console.error('Save user failed:', body.error ?? res.status);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.uid || !churchId) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/church-users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, userId: selectedUser.uid }),
      });
      if (res.ok) {
        await fetchUsers();
        goBackToList();
      } else {
        const body = await res.json().catch(() => ({}));
        console.error('Delete user failed:', body.error ?? res.status);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransferBillingOwner = async () => {
    if (!selectedUser?.uid || !churchId) return;
    setIsTransferringBillingOwner(true);
    try {
      const res = await fetch('/api/church/transfer-billing-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, newOwnerId: selectedUser.uid }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Transfer billing owner failed:', body.error ?? res.status);
      }
    } finally {
      setIsTransferringBillingOwner(false);
    }
  };

  const getSortedUsers = (list: AppUser[]) =>
    [...list].sort((a, b) => {
      const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim().toLowerCase();
      const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });

  return {
    users,
    loading,

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
  };
}
