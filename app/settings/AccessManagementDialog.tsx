'use client';

import * as React from 'react';
import { doc, updateDoc, setDoc, serverTimestamp, collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db, createSecondaryUser } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Dialog, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '../components/ui/skeleton';
import { useChurchId } from '../hooks/useChurchId';
import { listenToMembers } from '../lib/members';
import type { Member } from '../lib/types';
import { StandardDialogLayout } from '../components/layout/StandardDialogLayout';
import { useUserRoles } from '../hooks/useUserRoles';
import { deleteDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const ROLE_MAP: Record<string, string> = {
  Admin: "Administrator",
  EventManager: "Event Manager",
  Finance: "Finance Manager",
  MemberManager: "Member Manager",
  MusicManager: "Music Manager",
  MusicMember: "Music Member",
};

const ALL_ROLES = Object.keys(ROLE_MAP);

export function AccessManagementDialog({ children }: { children: React.ReactNode }) {
  const [isListOpen, setIsListOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  // Login creation state
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [isCreatingLogin, setIsCreatingLogin] = React.useState(false);

  const { toast } = useToast();
  const churchId = useChurchId();

  const functions = getFunctions();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // 🔥 Listen to members
  React.useEffect(() => {
    if (isListOpen && churchId) {
      setLoading(true);
      const unsubscribe = listenToMembers(churchId, (membersList) => {
        setMembers(membersList);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isListOpen, churchId]);

  // 🔥 Listen to users (for roles)
  React.useEffect(() => {
    if (!churchId) return;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });

    return () => unsubscribe();
  }, [churchId]);

  // 🔥 Build map: email → roles string
  const userRolesByEmail: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      map[u.email] = roles.map((r: string) => ROLE_MAP[r] || r).join(", ");
    });
    return map;
  }, [users]);

  const handleEditClick = (member: Member) => {
    setEditingMember(member);

    // 🔥 Find the user doc for this member
    const user = users.find((u) => u.email === member.email);
  
    // 🔥 Use roles from the USER doc, not the MEMBER doc
    const roles = Array.isArray(user?.roles) ? user.roles : [];
  
    setSelectedRoles(roles);
    setLoginEmail(member.email || "");
    setLoginPassword("");
  };  

  const hasAccount = !!userRolesByEmail[editingMember?.email ?? ""];

  const handleCloseEdit = () => {
    setEditingMember(null);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (role === "Admin") {
      setSelectedRoles(checked ? ["Admin"] : []);
    } else {
      setSelectedRoles((prev) => {
        const newRoles = checked ? [...prev, role] : prev.filter((r) => r !== role);
        return newRoles.filter((r) => r !== "Admin");
      });
    }
  };

  const handleCreateLogin = async () => {
    if (!churchId || !loginEmail || !loginPassword || !editingMember) {
      toast({
        title: "Error",
        description: "Please enter an email and password.",
        variant: "destructive",
      });
      return;
    }

    if (loginPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingLogin(true);
    try {
      const newUser = await createSecondaryUser(loginEmail, loginPassword);

      const userDocRef = doc(db, "users", newUser.uid);
      await setDoc(userDocRef, {
        email: loginEmail,
        displayName: `${editingMember.firstName} ${editingMember.lastName}`,
        churchId,
        roles: [],
        createdAt: serverTimestamp(),
      });

      if (editingMember.email !== loginEmail) {
        const memberDocRef = doc(db, "churches", churchId, "members", editingMember.id);
        await updateDoc(memberDocRef, { email: loginEmail });
      }

      toast({
        title: "Success",
        description: `Login created for ${loginEmail}.`,
      });
      setLoginPassword("");
    } catch (error: any) {
      console.error("Error creating login:", error);
      toast({
        title: "Error Creating Login",
        description: error.message || "Failed to create user account.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLogin(false);
    }
  };

  const handleUpdateRoles = async () => {
    if (!editingMember) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", editingMember.email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({
          title: "No User Account",
          description: "This member does not have a login yet.",
          variant: "destructive",
        });
        return;
      }

      const userDoc = snapshot.docs[0];
      const userDocRef = doc(db, "users", userDoc.id);

      await setDoc(
        userDocRef,
        {
          roles: selectedRoles,
        },
        { merge: true }
      );

      toast({
        title: "Success",
        description: `Roles for ${editingMember.firstName} ${editingMember.lastName} updated successfully.`,
      });

      handleCloseEdit();
    } catch (error) {
      console.error("Error updating roles:", error);
      toast({
        title: "Error",
        description: "Failed to update roles.",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (role: string) => ROLE_MAP[role] || role;
  
  const handleDeleteUserAccount = async () => {
    if (!loginEmail) {
      console.error("No login email provided");
      return;
    }
  
    try {
      setIsDeleting(true);
  
      const deleteUserFn = httpsCallable(functions, "deleteUserByEmail");
      await deleteUserFn({ email: loginEmail });
  
      const q = query(collection(db, "users"), where("email", "==", loginEmail));
      const snap = await getDocs(q);
  
      snap.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
  
      setLoginEmail("");
      setLoginPassword("");
      setSelectedRoles([]);
  
      toast({
        title: "Success",
        description: "User account deleted",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };  
  
  return (
    <>
      {/* LIST DIALOG */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <StandardDialogLayout
          title="Access Management"
          description="Manage user logins and permissions for your organization."
          onClose={() => setIsListOpen(false)}
        >
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div>
                    <p className="font-semibold">
                      {member.firstName} {member.lastName}
                    </p>

                    {/* 🔥 FIXED: Now showing USER roles, not MEMBER roles */}
                    <p className="text-sm text-muted-foreground">
                      {userRolesByEmail[member.email ?? ""] || "No roles assigned"}
                    </p>
                  </div>

                  <Button variant="outline" onClick={() => handleEditClick(member)}>
                    Edit
                  </Button>
                </div>
              ))
            )}
          </div>
        </StandardDialogLayout>
      </Dialog>

      {/* EDIT ROLES DIALOG */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => {
          if (!open) handleCloseEdit();
        }}
      >
        <StandardDialogLayout
          title={`User Access: ${editingMember?.firstName} ${editingMember?.lastName}`}
          description="Create or update login credentials and assign roles."
          onClose={handleCloseEdit}
          footer={<Button onClick={handleUpdateRoles}>Update Roles</Button>}
        >
          <div className="space-y-6">
            {/* Login Creation Section */}
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <h4 className="text-md font-bold">Create/Update Login</h4>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-email">Email (Username)</Label>
                  <Input
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="member@example.com"
                  />
                </div>

                <div className="flex gap-2 items-start">
                  <Input
                    id="login-password"
                    type="text"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />

                  <Button
                    type="button"
                    onClick={handleCreateLogin}
                    disabled={isCreatingLogin || !loginEmail || !loginPassword}
                    size="sm"
                  >
                    {isCreatingLogin ? "Creating..." : "Create"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>

                </div>

              </div>
            </div>

            {/* Roles & Permissions Section */}
            <div
              className={`space-y-4 p-4 border rounded-md bg-muted/30 ${
                !hasAccount ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <h4 className="text-md font-bold">Roles & Permissions</h4>

              {!hasAccount && (
                <p className="text-sm text-muted-foreground">
                  Create a login first to assign roles.
                </p>
              )}

              <div className="space-y-2">
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                      disabled={
                        !hasAccount ||
                        (role !== "Admin" && selectedRoles.includes("Admin"))
                      }
                    />
                    <Label
                      htmlFor={`role-${role}`}
                      className={
                        !hasAccount ||
                        (role !== "Admin" && selectedRoles.includes("Admin"))
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      {getRoleDisplayName(role)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </StandardDialogLayout>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the login for <strong>{loginEmail}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                handleDeleteUserAccount();
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
