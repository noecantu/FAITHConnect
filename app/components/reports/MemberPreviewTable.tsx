'use client';

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
  checkInCode?: string;
  qrCode?: string;
  notes?: string;
  status?: string;
}

interface Props {
  members: Member[];
  selectedFields: string[];
}

export function MemberPreviewTable({ members, selectedFields }: Props) {
  if (!members || members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  // Format a single field value
  const formatField = (member: Member, field: string) => {
  const value = (member as any)[field];
  if (!value) return "";

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
            {selectedFields.map((field) => (
              <th key={field} className="px-3 py-2 text-left font-medium">
                {field}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t">
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
