'use client';

import { useState } from "react";
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

const PAGE_SIZE = 20;

export function MemberPreviewTable({ members, selectedFields }: Props) {
  const [page, setPage] = useState(0);

  if (!members || members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleMembers = members.slice(start, end);

  const totalPages = Math.ceil(members.length / PAGE_SIZE);

  const formatField = (member: Member, field: string) => {
    const value = (member as any)[field];
    if (!value) return "—";

    if (field === "phoneNumber") {
      return formatPhone(value);
    }

    if (field === "address" && typeof value === "object") {
      const { street, city, state, zip } = value;
      return [street, city, state, zip].filter(Boolean).join(", ");
    }

    if (
      field === "birthday" ||
      field === "baptismDate" ||
      field === "anniversary"
    ) {
      return value;
    }

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
    <div className="space-y-2">
      <div className="overflow-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-3 py-2">Name</th>

              {selectedFields.map((field) => (
                <th key={field} className="text-left px-3 py-2">
                  {fieldLabelMap[field] ?? field}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleMembers.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="px-3 py-2">
                  {member.firstName} {member.lastName}
                </td>

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

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Showing {start + 1}–{Math.min(end, members.length)} of {members.length} members
        </p>

        <div className="space-x-2">
          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>

          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
