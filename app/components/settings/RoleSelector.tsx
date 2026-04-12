'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Role, ALL_ROLES, SYSTEM_ROLES } from '@/app/lib/auth/roles';
import { can } from '@/app/lib/auth/permissions';

interface Props {
  selectedRoles: Role[];
  onChange: (role: Role, checked: boolean) => void;

  currentUserId: string;
  currentUserRoles: Role[];
  targetUserId: string;
}

export default function RoleSelector({
  selectedRoles,
  onChange,
  currentUserId,
  currentUserRoles,
  targetUserId,
}: Props) {
  const [isSystemUser, setIsSystemUser] = useState(false);
  const [canAssignRoles, setCanAssignRoles] = useState(false);

  useEffect(() => {
    setIsSystemUser(
      currentUserRoles.some((r) => SYSTEM_ROLES.includes(r as any))
    );

    setCanAssignRoles(can(currentUserRoles, "roles.assign"));
  }, [currentUserRoles]);

  const isSelf = currentUserId === targetUserId;

  return (
    <div className="space-y-3">
      <Label>User Roles</Label>

      {/* Church Roles */}
      <div className="space-y-2 border border-white/10 rounded-md p-3">
        <p className="text-sm text-muted-foreground">Church Roles</p>

        {ALL_ROLES.map((role) => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedRoles.includes(role)}
              onCheckedChange={(checked) =>
                onChange(role, Boolean(checked))
              }
              disabled={!canAssignRoles}
            />
            <span>{role}</span>
          </div>
        ))}
      </div>

      {/* System Roles */}
      <div className="space-y-2 border border-white/10 rounded-md p-3">
        <p className="text-sm text-muted-foreground">System Roles</p>

        {SYSTEM_ROLES.map((role) => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedRoles.includes(role as Role)}
              onCheckedChange={(checked) =>
                onChange(role as Role, Boolean(checked))
              }
              disabled={!canAssignRoles}
            />
            <span>{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
