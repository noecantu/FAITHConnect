'use client';

import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { X } from 'lucide-react';

import RoleSelector from './RoleSelector';
import type { Mode } from '@/app/lib/types';
import type { Role } from '@/app/lib/roles';

interface Props {
  mode: Mode;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedRoles: Role[];

  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;

  onRoleChange: (role: Role, checked: boolean) => void;

  onCreate: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;

  isCreating: boolean;
  isSaving: boolean;
}

export default function UserFormCard({
  mode,
  firstName,
  lastName,
  email,
  password,
  selectedRoles,

  setFirstName,
  setLastName,
  setEmail,
  setPassword,

  onRoleChange,
  onCreate,
  onSave,
  onDelete,
  onClose,

  isCreating,
  isSaving,
}: Props) {
  return (
    <Card className="p-4 space-y-4 relative">
      <button
        onClick={onClose}
        className="
          absolute right-4 top-4
          text-muted-foreground hover:text-foreground
          transition
        "
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="text-lg font-semibold pr-8">
        {mode === 'create' ? 'Create User Account' : 'Edit User Account'}
      </h2>

      <div className="grid gap-4">
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

      <RoleSelector selectedRoles={selectedRoles} onChange={onRoleChange} />

      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
        {mode === 'edit' && (
          <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
            Delete User
          </Button>
        )}

        {mode === 'create' ? (
          <Button onClick={onCreate} disabled={isCreating} className="w-full sm:w-auto">
            {isCreating ? 'Creating...' : 'Create Account'}
          </Button>
        ) : (
          <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </Card>
  );
}
