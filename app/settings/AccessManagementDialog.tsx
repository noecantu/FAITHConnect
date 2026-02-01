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
import { db, createSecondaryUser } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from '../components/ui/button';
import { Dialog, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Skeleton } from '../components/ui/skeleton';
import { StandardDialogLayout } from '../components/layout/StandardDialogLayout';
import { useToast } from '../hooks/use-toast';
import { useChurchId } from '../hooks/useChurchId';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const ROLE_MAP: Record<string, string> = {
  Admin: 'Administrator',
  EventManager: 'Event Manager',
  Finance: 'Finance Manager',
  MemberManager: 'Member Manager',
  MusicManager: 'Music Manager',
  MusicMember: 'Music Member',
};

const ALL_ROLES = Object.keys(ROLE_MAP);

interface User {
  id: string;
  churchId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: string[];
  settings?: {
    calendarView?: 'calendar' | 'list';
    cardView?: 'show' | 'hide';
    fiscalYear?: string;
  };
}

export function AccessManagementDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const { toast } = useToast();
  const functions = getFunctions();
  const churchId = useChurchId();

  // Listen to users for this church
  React.useEffect(() => {
    if (!isOpen || !churchId) return;

    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('churchId', '==', churchId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }) as User
        );
        setUsers(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [isOpen, churchId]);

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const A = `${a.lastName ?? ''}, ${a.firstName ?? ''}`.toLowerCase();
      const B = `${b.lastName ?? ''}, ${b.firstName ?? ''}`.toLowerCase();
      return A.localeCompare(B);
    });
  }, [users]);

  const resetForm = () => {
    setEditingUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email);
    setSelectedRoles(user.roles ?? []);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (role === 'Admin') {
      setSelectedRoles(checked ? ['Admin'] : []);
    } else {
      setSelectedRoles((prev) => {
        const next = checked ? [...prev, role] : prev.filter((r) => r !== role);
        return next.filter((r) => r !== 'Admin');
      });
    }
  };

  const handleCreateUser = async () => {
    if (!churchId) {
      toast({ title: 'Error', description: 'No church selected.', variant: 'destructive' });
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      toast({ title: 'Missing fields', description: 'Please fill all fields.' });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const authUser = await createSecondaryUser(email, password);
      const uid = authUser.uid;

      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        id: uid,
        churchId,
        firstName,
        lastName,
        email,
        roles: [],
        createdAt: serverTimestamp(),
      });

      const newUser: User = {
        id: uid,
        churchId,
        firstName,
        lastName,
        email,
        roles: [],
      };

      setEditingUser(newUser);
      setSelectedRoles([]);
      setPassword('');

      toast({ title: 'Success', description: 'User account created.' });
    } catch (error: any) {
      toast({
        title: 'Error creating user',
        description: error?.message ?? 'Failed to create user account.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    if (!firstName || !lastName || !email) {
      toast({ title: 'Missing fields', description: 'First, last, and email are required.' });
      return;
    }

    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        roles: selectedRoles,
      });

      toast({ title: 'Success', description: 'User updated successfully.' });
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error?.message ?? 'Failed to update user.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;

    setIsDeleting(true);

    try {
      const deleteUserFn = httpsCallable(functions, 'deleteUserByEmail');
      await deleteUserFn({ email: editingUser.email });

      await deleteDoc(doc(db, 'users', editingUser.id));

      toast({ title: 'Success', description: 'User account deleted.' });
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error deleting user',
        description: error?.message ?? 'Failed to delete user account.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
  
        <StandardDialogLayout
          title="Access Management"
          description="Manage user accounts and roles for this church."
          onClose={() => {
            setIsOpen(false);
            resetForm();
          }}
          footer={
            <div className="flex justify-end gap-2">
              {!editingUser ? (
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Account"}
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveUser} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
  
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </>
              )}
            </div>
          }
        >
          {/* USERS LIST */}
          <div className="space-y-4">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-2">
                {sortedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <p className="font-semibold">
                        {(u.firstName ?? "") + " " + (u.lastName ?? "")}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.roles?.length
                          ? u.roles.map((r) => ROLE_MAP[r] ?? r).join(", ")
                          : "No roles assigned"}
                      </p>
                    </div>
  
                    <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          {/* CREATE / EDIT USER FORM */}
          <div className="mt-6 p-4 border rounded-md bg-muted/30">
            <h4 className="text-md font-bold mb-4">
              {editingUser ? "Edit User Account" : "Create User Account"}
            </h4>
  
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="user-first-name">First Name</Label>
                <Input
                  id="user-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
  
              <div className="grid gap-1">
                <Label htmlFor="user-last-name">Last Name</Label>
                <Input
                  id="user-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
  
              <div className="grid gap-1">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
  
              {!editingUser && (
                <div className="grid gap-1">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </div>
              )}
            </div>
          </div>
  
          {/* ROLES */}
          {editingUser && (
            <div className="mt-6 space-y-4 p-4 border rounded-md bg-muted/30">
              <h4 className="text-md font-bold">Roles & Permissions</h4>
  
              <div className="space-y-2">
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                    />
                    <Label htmlFor={`role-${role}`}>{ROLE_MAP[role]}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StandardDialogLayout>
      </Dialog>
  
      {/* DELETE CONFIRMATION */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the login for <strong>{email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
  
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
  
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteUser();
                }}
              >
                Confirm Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );  
}
