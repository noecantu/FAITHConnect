'use client';

import { useState } from "react";
import { formatPhone } from "@/app/lib/formatters";
import { PreviewPaginationFooter } from "../layout/PreviewPaginationFooter";
import { ReportContainer } from "../reports/ReportContainer";

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

    if (field === "phoneNumber") return formatPhone(value);

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
    <ReportContainer
      footer={
        <PreviewPaginationFooter
          start={start}
          end={end}
          total={members.length}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          label="records"
        />
      }
    >
      <div className="w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto rounded-md border border-white/20 bg-black/50 backdrop-blur-xl w-full min-h-[300px]">
          <table className="min-w-max text-sm">
            <thead className="bg-slate-800 border-b border-white/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-white/80">
                  Name
                </th>

                {selectedFields.map((field) => (
                  <th
                    key={field}
                    className="text-left px-4 py-3 font-medium text-white/80"
                  >
                    {fieldLabelMap[field] ?? field}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-t border-white/20 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-white/90">
                    {member.firstName} {member.lastName}
                  </td>

                  {selectedFields.map((field) => (
                    <td key={field} className="px-4 py-3 text-white/90">
                      {formatField(member, field)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportContainer>
  );
}
