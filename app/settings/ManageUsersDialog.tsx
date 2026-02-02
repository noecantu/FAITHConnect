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

import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
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


// ---------------------------------------------------------
// ROLE MAP
// ---------------------------------------------------------
export const ROLE_MAP = {
  Admin: "Administrator",
  EventManager: "Event Manager",
  Finance: "Finance Manager",
  MemberManager: "Member Manager",
  MusicManager: "Music Manager",
  MusicMember: "Music Member",
} as const;

export type Role = keyof typeof ROLE_MAP;

export const ALL_ROLES: Role[] = Object.keys(ROLE_MAP) as Role[];


// ---------------------------------------------------------
// USER TYPE
// ---------------------------------------------------------
export interface User {
  id: string;
  churchId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: Role[];
}


// ---------------------------------------------------------
// MANAGE USERS DIALOG
// ---------------------------------------------------------
interface ManageUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  users: User[];
  loading: boolean;
}

function ManageUsersDialog({
  open,
  onOpenChange,
  onCreate,
  onEdit,
  users,
  loading,
}: ManageUsersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogLayout
        title="Access Management"
        description="Manage user accounts and roles for this church."
        onClose={() => onOpenChange(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={onCreate}>Create Account</Button>
          </div>
        }
      >
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
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
                    {u.roles.length
                      ? u.roles.map((r) => ROLE_MAP[r]).join(", ")
                      : "No roles assigned"}
                  </p>
                </div>

                <Button variant="outline" size="sm" onClick={() => onEdit(u)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </StandardDialogLayout>
    </Dialog>
  );
}


// ---------------------------------------------------------
// CREATE USER DIALOG
// ---------------------------------------------------------
interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  isCreating: boolean;
}

function CreateUserDialog({
  open,
  onClose,
  onCreate,
  firstName,
  lastName,
  email,
  password,
  setFirstName,
  setLastName,
  setEmail,
  setPassword,
  isCreating,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <StandardDialogLayout
        title="Create User Account"
        description="Add a new user to this church."
        onClose={onClose}
        footer={
          <div className="flex justify-end">
            <Button onClick={onCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 p-4 border rounded-md bg-muted/30">
          <div className="grid gap-1">
            <Label>First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label>Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label>Password</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
          </div>
        </div>
      </StandardDialogLayout>
    </Dialog>
  );
}


// ---------------------------------------------------------
// EDIT USER DIALOG
// ---------------------------------------------------------
interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  firstName: string;
  lastName: string;
  email: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  selectedRoles: Role[];
  handleRoleChange: (role: Role, checked: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
}

function EditUserDialog({
  open,
  onClose,
  user,
  firstName,
  lastName,
  email,
  setFirstName,
  setLastName,
  setEmail,
  selectedRoles,
  handleRoleChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  showDeleteConfirm,
  setShowDeleteConfirm,
}: EditUserDialogProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <StandardDialogLayout
          title={`Edit User: ${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
          description="Update user details and roles."
          onClose={onClose}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 p-4 border rounded-md bg-muted/30">
            <div className="grid gap-1">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>

            <div className="grid gap-1">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>

            <div className="grid gap-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="text-md font-bold">Roles & Permissions</h4>

            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                  />
                  <Label>{ROLE_MAP[role]}</Label>
                </div>
              ))}
            </div>
          </div>
        </StandardDialogLayout>
      </Dialog>

      {/* Delete Confirmation */}
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
                  onDelete();
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


// ---------------------------------------------------------
// ACCESS MANAGEMENT CONTROLLER
// ---------------------------------------------------------
export function AccessManagementController() {
  const churchId = useChurchId();
  const { toast } = useToast();
  const functions = getFunctions();

  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [showManage, setShowManage] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [selectedRoles, setSelectedRoles] = React.useState<Role[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);


  // LOAD USERS
  React.useEffect(() => {
    if (!churchId) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("churchId", "==", churchId));

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


  // RESET FORM
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setSelectedRoles([]);
    setEditingUser(null);
  };


  // CREATE USER
  const handleCreateUser = async () => {
    if (!churchId) return;

    if (!firstName || !lastName || !email || !password) {
      toast({ title: "Missing fields", description: "Please fill all fields." });
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
        roles: [],
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "User created." });

      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    } finally {
      setIsCreating(false);
    }
  };


  // SAVE USER
  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        firstName,
        lastName,
        email,
        roles: selectedRoles,
      });

      toast({ title: "Success", description: "User updated." });

      setEditingUser(null);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };


  // DELETE USER
  const handleDeleteUser = async () => {
    if (!editingUser) return;

    setIsDeleting(true);

    try {
      const deleteFn = httpsCallable(functions, "deleteUserByEmail");
      await deleteFn({ email: editingUser.email });

      await deleteDoc(doc(db, "users", editingUser.id));

      toast({ title: "Success", description: "User deleted." });

      setEditingUser(null);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    } finally {
      setIsDeleting(false);
    }
  };


  // ROLE CHANGE
  const handleRoleChange = (role: Role, checked: boolean) => {
    if (role === "Admin") {
      setSelectedRoles(checked ? ["Admin"] : []);
    } else {
      setSelectedRoles((prev) => {
        const next = checked
          ? [...prev, role]
          : prev.filter((r) => r !== role);
        return next.filter((r) => r !== "Admin");
      });
    }
  };


  // ---------------------------------------------------------
  // RETURN — CONDITIONAL RENDERING (THE FIX)
  // ---------------------------------------------------------
  return (
    <>
      {/* Manage button */}
      <Button
        className="w-full sm:w-auto"
        onClick={() => setShowManage(true)}
      >
        Manage
      </Button>
  
      {/* Manage Users Dialog */}
      <ManageUsersDialog
        open={showManage}
        onOpenChange={(open) => {
          setShowManage(open);
          if (!open) {
            resetForm();
            setEditingUser(null);
          }
        }}
        users={users}
        loading={loading}
        onEdit={(user) => {
          setEditingUser(user);
          setFirstName(user.firstName ?? "");
          setLastName(user.lastName ?? "");
          setEmail(user.email);
          setSelectedRoles(user.roles ?? []);
        }}
        onCreate={() => {
          resetForm();
          setShowCreate(true);
        }}
      />
  
      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetForm();
        }}
        onCreate={handleCreateUser}
        firstName={firstName}
        lastName={lastName}
        email={email}
        password={password}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setEmail={setEmail}
        setPassword={setPassword}
        isCreating={isCreating}
      />
  
      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editingUser}
        onClose={() => {
          setEditingUser(null);
          resetForm();
        }}
        user={editingUser}
        firstName={firstName}
        lastName={lastName}
        email={email}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setEmail={setEmail}
        selectedRoles={selectedRoles}
        handleRoleChange={handleRoleChange}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        isSaving={isSaving}
        isDeleting={isDeleting}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />
    </>
  );  
}
