'use client';

import { FieldValue } from "@/app/lib/report-types";
import { Member } from "../../lib/types";

interface Props {
  members: Member[];
  selectedFields: string[];
  fieldLabelMap: Record<string, string>;
  formatField: (value: FieldValue) => string;
}

export function MemberPreviewTable({
  members,
  selectedFields,
  fieldLabelMap,
  formatField,
}: Props) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted">
        <tr>
          <th className="p-2 text-left">Name</th>
          {selectedFields.map((f) => (
            <th key={f} className="p-2 text-left">
              {fieldLabelMap[f]}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {members.map((m) => (
          <tr key={m.id} className="border-t">
            <td className="p-2">
              {m.firstName} {m.lastName}
            </td>

            {selectedFields.map((f) => (
              <td key={f} className="p-2">
                {formatField(m[f as keyof Member])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
