'use client';

import * as React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurchId } from '@/hooks/useChurchId';
import { listenToMembers } from '@/lib/members';
import type { Member } from '@/lib/types';

const ROLE_MAP: Record<string, string> = {
  "Admin": "Administrator",
  "EventManager": "Event Manager",
  "MemberManager": "Member Manager",
  "Finance": "Finance Manager"
};

const ALL_ROLES = Object.keys(ROLE_MAP);

export function MemberRolesDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  const { toast } = useToast();
  const churchId = useChurchId();

  React.useEffect(() => {
    if (isOpen && churchId) {
      setLoading(true);
      const unsubscribe = listenToMembers(churchId, (membersList) => {
        setMembers(membersList);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isOpen, churchId]);

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setSelectedRoles(member.roles || []);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (role === 'Admin') {
      // If Admin is checked, it's the only role. If unchecked, clear roles.
      setSelectedRoles(checked ? ['Admin'] : []);
    } else {
      // For other roles, add/remove them from the list, ensuring Admin isn't present.
      setSelectedRoles(prev => {
        const newRoles = checked
          ? [...prev, role]
          : prev.filter(r => r !== role);
        return newRoles.filter(r => r !== 'Admin'); // Should be redundant but safe
      });
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
      setEditingMember(null);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Member Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles for members in your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-semibold">{member.firstName} {member.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {(member.roles?.includes('Admin'))
                      ? getRoleDisplayName('Admin')
                      : (member.roles || []).map(getRoleDisplayName).join(', ') || 'No roles assigned'
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={() => handleEditClick(member)}>
                  Edit
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Nested Dialog for editing roles */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Roles for {editingMember?.firstName} {editingMember?.lastName}</DialogTitle>
              <DialogDescription>
                Select the roles to assign to this member. Administrator includes all permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {ALL_ROLES.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                    disabled={role !== 'Admin' && selectedRoles.includes('Admin')}
                  />
                  <Label 
                    htmlFor={`role-${role}`}
                    className={role !== 'Admin' && selectedRoles.includes('Admin') ? 'text-muted-foreground' : ''}
                  >
                    {getRoleDisplayName(role)}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={handleUpdateRoles}>Update Roles</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </DialogContent>
    </Dialog>
  );
}
