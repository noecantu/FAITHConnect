'use client';

import { useState, useMemo } from 'react';
import { db } from '@/app/lib/firebase/client';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { useToast } from '@/app/hooks/use-toast';
import { Role } from '@/app/lib/auth/permissions/roles';
import { User, Mode } from '@/app/lib/types';
import { can } from "@/app/lib/auth/permissions/can";
import { useUserRoles } from "@/app/hooks/useUserRoles";
import { useChurchId } from "@/app/hooks/useChurchId";

export function useUserManagement() {
  const { toast } = useToast();
  const functions = getFunctions(undefined, 'us-central1');

  const { roles: actorRoles } = useUserRoles();
  const { churchId } = useChurchId();

  const canAssignRoles = can(actorRoles, "roles.assign");
  const canManageChurch = can(actorRoles, "church.manage");

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
    if (!canAssignRoles) return;

    if (role === "Admin") {
      setSelectedRoles(checked ? ["Admin"] : []);
      return;
    }

    setSelectedRoles((prev) => {
      const next = checked
        ? [...prev.filter((r) => r !== "Admin"), role]
        : prev.filter((r) => r !== role);

      return next;
    });
  };

  // -----------------------------
  // CREATE USER
  // -----------------------------
  const handleCreateUser = async () => {
    if (!churchId) return;

    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill all fields.",
      });
      return;
    }

    if (!canManageChurch) {
      toast({ title: "Forbidden", description: "You cannot create users." });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create the Auth user + assign roles + set churchId (server-side)
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          roles: canAssignRoles ? selectedRoles : [],
          churchId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user.");
      }

      const { uid } = await res.json();

      // 2. Create Firestore profile (client-side)
      await setDoc(doc(db, "users", uid), {
        id: uid,
        churchId,
        firstName,
        lastName,
        email,
        roles: canAssignRoles ? selectedRoles : [],
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

  // -----------------------------
  // SAVE USER
  // -----------------------------
  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (!canManageChurch) {
      toast({ title: "Forbidden", description: "You cannot edit users." });
      return;
    }

    setIsSaving(true);

    try {
      const rolesToAssign = canAssignRoles ? selectedRoles : selectedUser.roles;

      await updateDoc(doc(db, "users", selectedUser.id), {
        firstName,
        lastName,
        email,
        roles: rolesToAssign,
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

  // -----------------------------
  // DELETE USER
  // -----------------------------
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (!canManageChurch) {
      toast({ title: "Forbidden", description: "You cannot delete users." });
      return;
    }

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

    getSortedUsers: sortedUsers,
  };
}
