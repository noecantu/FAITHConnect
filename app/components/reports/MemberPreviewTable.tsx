'use client';

import { formatPhone } from "@/app/lib/formatters";

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  birthday?: string | null;
  baptismDate?: string | null;
  anniversary?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  status?: string;
  checkInCode?: string;
  qrCode?: string;
  notes?: string;
}

interface Props {
  members: Member[];
  selectedFields: string[];
}

export const fieldLabelMap: Record<string, string> = {
  email: "Email",
  phoneNumber: "Phone Number",
  birthday: "Birthday",
  baptismDate: "Baptism Date",
  anniversary: "Anniversary",
  address: "Address",
  status: "Status",
  checkInCode: "Check-In Code",
  qrCode: "QR Code",
  notes: "Notes",
};

export function MemberPreviewTable({ members, selectedFields }: Props) {
  if (!members || members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  // Format a single field value
  const formatField = (member: Member, field: string) => {
    const value = (member as any)[field];
    if (!value) return "—";

    // Phone number
    if (field === "phoneNumber") {
      return formatPhone(value);
    }

    // Address object
    if (field === "address" && typeof value === "object") {
      const { street, city, state, zip } = value;
      return [street, city, state, zip].filter(Boolean).join(", ");
    }

    // Dates
    if (
      field === "birthday" ||
      field === "baptismDate" ||
      field === "anniversary"
    ) {
      return value;
    }

    // QR Code → render image
    if (field === "qrCode") {
      return (
        <img
          src={value}
          alt="QR Code"
          className="h-16 w-16 object-contain"
        />
      );
    }

    return value;
  };

  return (
    <div className="overflow-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {/* Always show Name first */}
            <th className="text-left px-3 py-2">Name</th>

            {/* Then the selected fields */}
            {selectedFields.map(field => (
              <th key={field} className="text-left px-3 py-2">
                {fieldLabelMap[field] ?? field}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t">
              {/* Always show Name first */}
              <td className="px-3 py-2">
                {member.firstName} {member.lastName}
              </td>

              {/* Then the selected fields */}
              {selectedFields.map((field) => (
                <td key={field} className="px-3 py-2">
                  {formatField(member, field)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
