'use client';

import { useState, useMemo } from 'react';
import { db } from '@/app/lib/firebase/client';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { useToast } from '@/app/hooks/use-toast';
import { Role } from '@/app/lib/auth/roles';
import type { AppUser, Mode } from '@/app/lib/types';
import { can } from "@/app/lib/auth/permissions";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAuth } from "@/app/hooks/useAuth";
import { updateUserAction } from "@/app/(dashboard)/admin/actions/updateUserAction";

export function useUserManagement() {
  const { toast } = useToast();

  const { roles: actorRoles } = usePermissions();
  const { churchId } = useChurchId();
  const { user: authUser } = useAuth();

  const canAssignRoles = can(actorRoles, "roles.assign");
  const canManageChurch = can(actorRoles, "church.manage");

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [regionName, setRegionName] = useState('');

  // -----------------------------
  // MODE + LOADING FLAGS
  // -----------------------------
  const [mode, setMode] = useState<Mode>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferringBillingOwner, setIsTransferringBillingOwner] = useState(false);

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedRoles([]);
    setRegionName('');
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
      const res = await fetch("/api/church-users/create", {
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
        uid,
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
  // SAVE USER (now uses updateUserAction)
  // -----------------------------
  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (!canManageChurch) {
      toast({ title: "Forbidden", description: "You cannot edit users." });
      return;
    }

    if (!authUser?.uid) {
      toast({ title: "Error", description: "Current user not available." });
      return;
    }

    setIsSaving(true);

    try {
      const rolesToAssign = canAssignRoles ? selectedRoles : (selectedUser.roles ?? []);

      await updateUserAction({
        userId: selectedUser.uid,
        firstName,
        lastName,
        email,
        roles: rolesToAssign,
        regionName: rolesToAssign.includes("RegionalAdmin") ? regionName || null : null,
        actorUid: authUser.uid,
        actorName: `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim(),
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
      if (churchId) {
        const churchSnap = await getDoc(doc(db, "churches", churchId));
        const churchData = churchSnap.exists()
          ? (churchSnap.data() as { billingOwnerUid?: unknown; createdBy?: unknown })
          : null;

        const billingOwnerUid =
          typeof churchData?.billingOwnerUid === "string"
            ? churchData.billingOwnerUid
            : typeof churchData?.createdBy === "string"
            ? churchData.createdBy
            : null;

        if (billingOwnerUid && selectedUser.uid === billingOwnerUid) {
          throw new Error(
            "This user is the billing owner for this church. Reassign billing ownership before deleting this account."
          );
        }
      }

      const res = await fetch('/api/church-users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: selectedUser.uid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete user.' }));
        throw new Error(data.error || 'Failed to delete user.');
      }

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
  // TRANSFER BILLING OWNER
  // -----------------------------
  const handleTransferBillingOwner = async () => {
    if (!selectedUser) return;

    if (!canManageChurch) {
      toast({ title: "Forbidden", description: "You cannot manage billing ownership." });
      return;
    }

    setIsTransferringBillingOwner(true);

    try {
      const res = await fetch('/api/church-users/transfer-billing-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: selectedUser.uid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to transfer billing ownership.' }));
        throw new Error(data.error || 'Failed to transfer billing ownership.');
      }

      toast({
        title: 'Success',
        description: 'Billing ownership transferred successfully.',
      });
    } catch (err: unknown) {
      let message = 'Something went wrong.';

      if (err instanceof Error) {
        message = err.message;
      }

      toast({ title: 'Error', description: message });
    } finally {
      setIsTransferringBillingOwner(false);
    }
  };

  // -----------------------------
  // MODE HELPERS
  // -----------------------------
  const startCreate = () => {
    resetForm();
    setMode('create');
  };

  const startEdit = (user: AppUser) => {
    setSelectedUser(user);
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email);
    setSelectedRoles(user.roles ?? []);
    setRegionName('');
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
    return (users: AppUser[]) =>
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
    goBackToList,

    getSortedUsers: sortedUsers,
  };
}