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
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { Fab } from '@/app/components/ui/fab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PageHeader } from '../components/page-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Database, UserRoundPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const { roles, isAdmin } = useUserRoles(churchId);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false);
    
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

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("https://getfirestoreusage-nn2kyrzdaa-uc.a.run.app");
  
        const data = await res.json();
        console.log("Usage data:", data);
  
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

  // const startConfirmDelete = (user: User) => {
  //   setSelectedUser(user);
  //   setMode('confirm-delete');
  // };

  const goBackToList = () => {
    resetForm();
    setMode('list');
  };

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const nameA = `${a.lastName ?? ''}, ${a.firstName ?? ''}`.toLowerCase();
      const nameB = `${b.lastName ?? ''}, ${b.firstName ?? ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);
  
  // RENDER
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage user accounts and roles for your organization."
        className="mb-2"
      />
  
      {/* LIST MODE */}
      {mode === 'list' && (
          <>
            {/* ACCOUNTS CARD */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between w-full">
                  <div>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                      Assign access and roles here.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {sortedUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No users found for this church.
                  </p>
                )}

                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    gap-4
                  "
                >
                  {sortedUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startEdit(u)}
                      className="
                        w-full text-left
                        p-4 rounded-md border bg-muted/20
                        hover:bg-muted transition
                        focus:outline-none focus:ring-2 focus:ring-primary
                      "
                    >
                      <p className="font-semibold">
                        {(u.firstName ?? '') + ' ' + (u.lastName ?? '')}
                      </p>

                      <p className="text-sm text-muted-foreground">{u.email}</p>

                      <p className="text-xs text-muted-foreground">
                        {u.roles.length
                          ? u.roles.map((r) => ROLE_MAP[r]).join(', ')
                          : 'No roles assigned'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* DATABASE STORAGE CARD */}
            <Card>
              <CardHeader>
                <CardTitle>Database Storage</CardTitle>
                <CardDescription>
                  View usage and storage allocation for your organization.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Storage Used</p>

                {!hasLoadedUsage && (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}

                {hasLoadedUsage && storageUsed === null && (
                  <p className="text-sm text-muted-foreground">No usage data available yet</p>
                )}

                {hasLoadedUsage && storageUsed !== null && (
                  <p className="font-medium">
                    {(storageUsed / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              </CardContent>
            </Card>
          </>
        )}

    {(mode === 'create' || mode === 'edit') && (
    <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">
        {mode === 'create' ? 'Create User Account' : 'Edit User Account'}
        </h2>

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

        <div className="space-y-4">
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

        <div
        className="
            flex flex-col sm:flex-row
            justify-end gap-2 mt-4
        "
        >
        {mode === 'edit' && (
            <Button
            variant="destructive"
            onClick={() => setMode('confirm-delete')}
            className="w-full sm:w-auto"
            >
            Delete User
            </Button>
        )}

        <Button
            variant="outline"
            onClick={goBackToList}
            className="w-full sm:w-auto"
        >
            Cancel
        </Button>

        {mode === 'create' ? (
            <Button
            onClick={handleCreateUser}
            disabled={isCreating}
            className="w-full sm:w-auto"
            >
            {isCreating ? 'Creating...' : 'Create Account'}
            </Button>
        ) : (
            <Button
            onClick={handleSaveUser}
            disabled={isSaving}
            className="w-full sm:w-auto"
            >
            {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        )}
        </div>
    </Card>
    )}
  
      {/* DELETE CONFIRMATION */}
      {mode === 'confirm-delete' && selectedUser && (
        <div className="space-y-4 border border-red-300 rounded-md p-4 bg-red-50">
          <h2 className="text-lg font-semibold text-red-700">
            Delete User Account
          </h2>
  
          <p className="text-sm text-red-800">
            This will permanently delete the login for{' '}
            <span className="font-semibold">{selectedUser.email}</span>.
          </p>
  
          <div
            className="
              flex flex-col sm:flex-row
              justify-end gap-2 mt-4
            "
          >
            <Button
              variant="outline"
              onClick={goBackToList}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
  
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      )}

      {/* Floating FAB Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Fab type="menu" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="end"
          className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1"
        >
          <DropdownMenuItem
            className="flex items-center justify-center p-2"
            onClick={() => startCreate()}
          >
            <UserRoundPlus className="h-4 w-4" />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-center p-2"
            // onClick={() => openStorageDetails()}
          >
            <Database className="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}
