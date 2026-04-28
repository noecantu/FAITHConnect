import { useState, useEffect, useCallback } from 'react';
import type { AppUser, Mode } from '@/app/lib/types';
import type { Role } from '@/app/lib/auth/roles';
import type { Permission } from '@/app/lib/auth/permissions';

export function useUserManagement(churchId: string | undefined, { onBillingOwnerTransferred }: { onBillingOwnerTransferred?: () => void } = {}) {
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
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
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
    try {
      const res = await fetch(`/api/church-users/list?churchId=${encodeURIComponent(churchId)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: Record<string, unknown>[] = await res.json();
        setUsers(
          data.map((row) => ({
            uid: row.id as string,
            email: row.email as string,
            firstName: row.first_name as string | null,
            lastName: row.last_name as string | null,
            roles: (row.roles as Role[]) ?? [],
            permissions: (row.permissions as Permission[]) ?? [],
            churchId: row.church_id as string | null,
            regionId: row.region_id as string | null,
            districtId: row.district_id as string | null,
            managedChurchIds: (row.managed_church_ids as string[]) ?? [],
            profilePhotoUrl: row.profile_photo_url as string | undefined,
            settings: row.settings as AppUser['settings'],
          }))
        );
      } else {
        const payload = await res.text();
        console.error('fetchUsers failed:', res.status, payload);
        setUsers([]);
      }
    } catch (err) {
      console.error('fetchUsers error:', err);
      setUsers([]);
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
    setSelectedPermissions([]);
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
    setSelectedPermissions((u.permissions ?? []) as Permission[]);
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

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, permission] : prev.filter((p) => p !== permission)
    );
  };

  const handleCreateUser = async () => {
    if (!churchId) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/church-users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, firstName, lastName, email, password, roles: selectedRoles, permissions: selectedPermissions }),
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
        body: JSON.stringify({ churchId, firstName, lastName, roles: selectedRoles, permissions: selectedPermissions }),
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
      const res = await fetch('/api/church-users/transfer-billing-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: selectedUser.uid }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Transfer billing owner failed:', body.error ?? res.status);
      } else {
        await fetchUsers();
        onBillingOwnerTransferred?.();
        goBackToList();
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
    selectedPermissions,
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
    handlePermissionChange,
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
