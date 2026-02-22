'use client';

import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { ALL_ROLES, ROLE_MAP, Role } from '@/app/lib/roles';

interface Props {
  selectedRoles: Role[];
  onChange: (role: Role, checked: boolean) => void;
}

export default function RoleSelector({ selectedRoles, onChange }: Props) {
  const VISIBLE_ROLES = ALL_ROLES.filter((r) => r !== "RootAdmin");
  return (
    <div className="space-y-4">
      <h4 className="text-md font-bold">Roles & Permissions</h4>

      <div className="space-y-2">
        {VISIBLE_ROLES.map((role) => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedRoles.includes(role)}
              onCheckedChange={(checked) => onChange(role, !!checked)}
            />
            <Label>{ROLE_MAP[role]}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
