'use client';

import * as React from 'react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, createSecondaryUser } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurchId } from '@/hooks/useChurchId';
import { listenToMembers } from '@/lib/members';
import type { Member } from '@/lib/types';
import { StandardDialogLayout } from '../layout/StandardDialogLayout';

const ROLE_MAP: Record<string, string> = {
  "Admin": "Administrator",
  "EventManager": "Event Manager",
  "Finance": "Finance Manager",
  "MemberManager": "Member Manager",
  "MusicManager": "Music Manager",
  "MusicMember": "Music Member",
};

const ALL_ROLES = Object.keys(ROLE_MAP);

export function MemberRolesDialog({ children }: { children: React.ReactNode }) {
  const [isListOpen, setIsListOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  
  // Login creation state
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [isCreatingLogin, setIsCreatingLogin] = React.useState(false);

  const { toast } = useToast();
  const churchId = useChurchId();

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

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setSelectedRoles(member.roles || []);
    setLoginEmail(member.email || "");
    setLoginPassword("");
  };

  const handleCloseEdit = () => {
    setEditingMember(null);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (role === 'Admin') {
      setSelectedRoles(checked ? ['Admin'] : []);
    } else {
      setSelectedRoles(prev => {
        const newRoles = checked ? [...prev, role] : prev.filter(r => r !== role);
        return newRoles.filter(r => r !== 'Admin');
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
      
      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, {
        email: loginEmail,
        displayName: `${editingMember.firstName} ${editingMember.lastName}`,
        churchId: churchId,
        roles: [],
        createdAt: serverTimestamp(),
      });

      if (editingMember.email !== loginEmail) {
          const memberDocRef = doc(db, 'churches', churchId, 'members', editingMember.id);
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
    if (!editingMember || !churchId) return;

    try {
      const memberDocRef = doc(db, 'churches', churchId, 'members', editingMember.id);
      await updateDoc(memberDocRef, {
        roles: selectedRoles,
      });
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

  return (
    <>
      {/* LIST DIALOG */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <StandardDialogLayout
          title="Manage Member Roles"
          description="Assign or remove roles for members in your organization."
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
                    <p className="text-sm text-muted-foreground">
                      {member.roles?.includes("Admin")
                        ? getRoleDisplayName("Admin")
                        : (member.roles || [])
                            .map(getRoleDisplayName)
                            .join(", ") || "No roles assigned"}
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
          title={`Access & Roles: ${editingMember?.firstName} ${editingMember?.lastName}`}
          description="Create a login for this member and assign their permissions."
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

                <div className="grid gap-2">
                  <Label htmlFor="login-password">New Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="login-password"
                      type="password"
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
                  </div>
                </div>
              </div>
            </div>

            {/* Roles & Permissions Section */}
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <h4 className="text-md font-bold">Roles & Permissions</h4>

              <div className="space-y-2">
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) =>
                        handleRoleChange(role, !!checked)
                      }
                      disabled={
                        role !== "Admin" && selectedRoles.includes("Admin")
                      }
                    />
                    <Label
                      htmlFor={`role-${role}`}
                      className={
                        role !== "Admin" && selectedRoles.includes("Admin")
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

    </>
  );
}  