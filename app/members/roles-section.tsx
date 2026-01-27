import { useState } from "react";
import type { Member } from "../lib/types";

interface RolesSectionProps {
  member: Member;
  onChange: (roles: string[]) => void;
}

export function RolesSection({ member, onChange }: RolesSectionProps) {
  const [roles, setRoles] = useState<string[]>(member.roles ?? []);

  function toggleRole(role: string) {
    const updated = roles.includes(role)
      ? roles.filter((r: string) => r !== role)
      : [...roles, role];

    setRoles(updated);
    onChange(updated);
  }

  return (
    <div>
      {/* your UI here */}
    </div>
  );
}
