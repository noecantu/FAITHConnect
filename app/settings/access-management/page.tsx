'use client';

import * as React from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, createSecondaryUser } from '@/app/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useToast } from '@/app/hooks/use-toast';
import { useChurchId } from '@/app/hooks/useChurchId';
import { ROLE_MAP, ALL_ROLES, Role } from '@/app/lib/roles';

// export const ROLE_MAP = {
//   Admin: 'Administrator',
//   EventManager: 'Event Manager',
//   Finance: 'Finance Manager',
//   MemberManager: 'Member Manager',
//   MusicManager: 'Music Manager',
//   MusicMember: 'Music Member',
// } as const;

// export type Role = keyof typeof ROLE_MAP;
// export const ALL_ROLES: Role[] = Object.keys(ROLE_MAP) as Role[];

export interface User {
  id: string;
  churchId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: Role[];
}

type Mode = 'list' | 'create' | 'edit' | 'confirm-delete';

export default function AccessManagementPage() {
  const churchId = useChurchId();
  const { toast } = useToast();
  const functions = getFunctions(undefined, 'us-central1');

  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [mode, setMode] = React.useState<Mode>('list');
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [selectedRoles, setSelectedRoles] = React.useState<Role[]>([]);

  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load users
  React.useEffect(() => {
    if (!churchId) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('churchId', '==', churchId));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        ...(d.data() as User),
        id: d.id,
      }));
      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [churchId]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
    setSelectedUser(null);
  };

  const handleRoleChange = (role: Role, checked: boolean) => {
    if (role === 'Admin') {
      setSelectedRoles(checked ? ['Admin'] : []);
    } else {
      setSelectedRoles((prev) => {
        const next = checked ? [...prev, role] : prev.filter((r) => r !== role);
        return next.filter((r) => r !== 'Admin');
      });
    }
  };

  // CREATE
  const handleCreateUser = async () => {
    if (!churchId) return;

    if (!firstName || !lastName || !email || !password) {
      toast({ title: 'Missing fields', description: 'Please fill all fields.' });
      return;
    }

    setIsCreating(true);

    try {
      const authUser = await createSecondaryUser(email, password);
      const uid = authUser.uid;

      await setDoc(doc(db, 'users', uid), {
        id: uid,
        churchId,
        firstName,
        lastName,
        email,
        roles: selectedRoles,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'User created.' });
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  // SAVE
  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setIsSaving(true);

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        firstName,
        lastName,
        email,
        roles: selectedRoles,
      });

      toast({ title: 'Success', description: 'User updated.' });
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);

    try {
      const deleteFn = httpsCallable(functions, 'deleteUserByUid');
      await deleteFn({ uid: selectedUser.id });

      await deleteDoc(doc(db, 'users', selectedUser.id));

      toast({ title: 'Success', description: 'User deleted.' });
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers to enter modes
  const startCreate = () => {
    resetForm();
    setMode('create');
  };

  const startEdit = (user: User) => {
    setSelectedUser(user);
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email);
    setSelectedRoles(user.roles ?? []);
    setMode('edit');
  };

  const startConfirmDelete = (user: User) => {
    setSelectedUser(user);
    setMode('confirm-delete');
  };

  const goBackToList = () => {
    resetForm();
    setMode('list');
  };

  // RENDER

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Access Management</h1>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Access Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and roles for this church.
          </p>
        </div>

        {mode === 'list' && (
          <Button onClick={startCreate}>Create Account</Button>
        )}
      </div>

      {mode === 'list' && (
        <div className="space-y-2">
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No users found for this church.
            </p>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <div>
                <p className="font-semibold">
                  {(u.firstName ?? '') + ' ' + (u.lastName ?? '')}
                </p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">
                  {u.roles.length
                    ? u.roles.map((r) => ROLE_MAP[r]).join(', ')
                    : 'No roles assigned'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(u)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => startConfirmDelete(u)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <div className="space-y-4 border rounded-md p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === 'create' ? 'Create User Account' : 'Edit User Account'}
            </h2>
            <Button variant="ghost" onClick={goBackToList}>
              Back to list
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode === 'create' && (
              <div className="grid gap-1">
                <Label>Password</Label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <h4 className="text-md font-bold">Roles & Permissions</h4>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) =>
                      handleRoleChange(role, !!checked)
                    }
                  />
                  <Label>{ROLE_MAP[role]}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={goBackToList}>
              Cancel
            </Button>
            {mode === 'create' ? (
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Account'}
              </Button>
            ) : (
              <Button onClick={handleSaveUser} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === 'confirm-delete' && selectedUser && (
        <div className="space-y-4 border rounded-md p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-red-700">
              Delete User Account
            </h2>
            <Button variant="ghost" onClick={goBackToList}>
              Cancel
            </Button>
          </div>

          <p className="text-sm text-red-800">
            This will permanently delete the login for{' '}
            <span className="font-semibold">{selectedUser.email}</span>.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={goBackToList}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
