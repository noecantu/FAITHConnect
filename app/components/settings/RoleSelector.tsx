'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import {
  SYSTEM_ROLES,
  CHURCH_ROLES,
  ALL_ROLES,
  ROLE_LABELS,
  type Role,
} from "@/app/lib/auth/roles";

interface Props {
  selectedRoles: Role[];
  onChange: (role: Role, checked: boolean) => void;
  currentUserId: string;
  targetUserId: string;
  currentUserRoles: Role[];
}

export default function RoleSelector({
  selectedRoles,
  onChange,
  currentUserId,
  targetUserId,
  currentUserRoles,
}: Props) {

  const isRootAdmin = currentUserRoles.includes("RootAdmin");
  const isSelf = currentUserId === targetUserId;

  // -----------------------------
  // DETERMINE WHICH ROLES ARE VISIBLE
  // -----------------------------
  const VISIBLE_ROLES: Role[] = isRootAdmin
    ? [...ALL_ROLES]
    : [...CHURCH_ROLES];

  // -----------------------------
  // DETERMINE WHICH ROLES ARE DISABLED
  // -----------------------------
  function isDisabled(role: Role) {
    if (isRootAdmin) return false; // RootAdmin can toggle anything

    // Church Admin cannot assign system roles
    if (SYSTEM_ROLES.includes(role as any)) return true;

    // Church Admin cannot remove their own Admin role
    if (isSelf && role === "Admin") return true;

    return false;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Roles & Permissions</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VISIBLE_ROLES.map((role) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedRoles.includes(role)}
                disabled={isDisabled(role)}
                onCheckedChange={(checked) => onChange(role, !!checked)}
              />
              <Label className={isDisabled(role) ? "text-muted-foreground" : ""}>
                {ROLE_LABELS[role]}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
