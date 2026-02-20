'use client';

import { useState, useMemo } from 'react';
import { db, createSecondaryUser } from '@/app/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { useToast } from '@/app/hooks/use-toast';
import { Role } from '@/app/lib/roles';
import { User, Mode } from '@/app/lib/types';

export function useUserManagement(churchId: string | null) {
  const { toast } = useToast();
  const functions = getFunctions(undefined, 'us-central1');

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // -----------------------------
  // MODE + LOADING FLAGS
  // -----------------------------
  const [mode, setMode] = useState<Mode>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
    setSelectedUser(null);
  };

  // -----------------------------
  // ROLE CHANGE
  // -----------------------------
  const handleRoleChange = (role: Role, checked: boolean) => {
    if (role === 'Admin') {
      setSelectedRoles(checked ? ['Admin'] : []);
      return;
    }

    setSelectedRoles((prev) => {
      const next = checked
        ? [...prev, role]
        : prev.filter((r) => r !== role);

      return next.filter((r) => r !== 'Admin');
    });
  };

  const handleCreateUser = async () => {
    if (!churchId) return;

    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill all fields.",
      });
      return;
    }

    setIsCreating(true);

    try {
      const authUser = await createSecondaryUser(email, password);
      const uid = authUser.uid;

      await setDoc(doc(db, "users", uid), {
        id: uid,
        churchId,
        firstName,
        lastName,
        email,
        roles: selectedRoles,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "User created." });
      resetForm();
      setMode("list");
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({ title: "Error", description: message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        firstName,
        lastName,
        email,
        roles: selectedRoles,
      });

      toast({ title: "Success", description: "User updated." });
      resetForm();
      setMode("list");
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({ title: "Error", description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);

    try {
      const deleteFn = httpsCallable(functions, "deleteUserByUid");
      await deleteFn({ uid: selectedUser.id });

      await deleteDoc(doc(db, "users", selectedUser.id));

      toast({ title: "Success", description: "User deleted." });
      resetForm();
      setMode("list");
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({ title: "Error", description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  // -----------------------------
  // MODE HELPERS
  // -----------------------------
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

  const goBackToList = () => {
    resetForm();
    setMode('list');
  };

  // -----------------------------
  // SORTED USERS
  // -----------------------------
  const sortedUsers = useMemo(() => {
    return (users: User[]) =>
      [...users].sort((a, b) => {
        const nameA = `${a.lastName ?? ""}, ${a.firstName ?? ""}`.toLowerCase();
        const nameB = `${b.lastName ?? ""}, ${b.firstName ?? ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, []);

  // -----------------------------
  // RETURN API
  // -----------------------------
  return {
    // state
    mode,
    selectedUser,
    firstName,
    lastName,
    email,
    password,
    selectedRoles,

    // setters
    setFirstName,
    setLastName,
    setEmail,
    setPassword,

    // flags
    isCreating,
    isSaving,
    isDeleting,

    // handlers
    handleRoleChange,
    handleCreateUser,
    handleSaveUser,
    handleDeleteUser,

    // mode helpers
    startCreate,
    startEdit,
    goBackToList,

    // utilities
    getSortedUsers: sortedUsers,
  };
}
