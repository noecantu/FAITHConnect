'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { ALL_ROLES, ROLE_MAP, Role } from '@/app/lib/auth/permissions/roles';

interface Props {
  selectedRoles: Role[];
  onChange: (role: Role, checked: boolean) => void;
  currentUserId: string;   // actor
  targetUserId: string;    // user being edited
  currentUserRoles: Role[]; // needed to detect RootAdmin
}

export default function RoleSelector({
  selectedRoles,
  onChange,
  currentUserId,
  targetUserId,
  currentUserRoles,
}: Props) {

  const VISIBLE_ROLES = ALL_ROLES.filter((r) => r !== "RootAdmin");

  const isSelf = currentUserId === targetUserId;
  const isRootAdmin = currentUserRoles.includes("RootAdmin");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Roles & Permissions</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VISIBLE_ROLES.map((role) => {
            const isAdminRole = role === "Admin";

            // Disable Admin checkbox if:
            // - user is editing themselves
            // - AND they are not RootAdmin
            const disableAdminToggle =
              isSelf && isAdminRole && !isRootAdmin;

            return (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  disabled={disableAdminToggle}
                  onCheckedChange={(checked) => onChange(role, !!checked)}
                />
                <Label
                  className={disableAdminToggle ? "text-muted-foreground" : ""}
                >
                  {ROLE_MAP[role]}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
