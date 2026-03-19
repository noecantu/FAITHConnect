import { Contribution, Member } from "@/app/lib/types";

export type ContributionRow = {
  memberName: string;
  amount: number;
  date: string;
  category: string;
  contributionType: string;
  notes: string;
};

/**
 * Convert raw Contribution objects into unified ContributionRow objects.
 * This ensures preview + export always use the same normalized data.
 */
export function mapToContributionRows(
  contributions: Contribution[],
  members: Member[]
): ContributionRow[] {
  return contributions.map((c) => {
    const member = members.find((m) => m.id === c.memberId);

    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : c.memberName ?? "Unknown";

    return {
      memberName,
      amount: c.amount,
      date: c.date,
      category: c.category,
      contributionType: c.contributionType,
      notes: c.notes ?? "",
    };
  });
}

/**
 * Reduce unified rows to only the fields selected by the user.
 * Member is ALWAYS included and always first.
 */
export function reduceContributionRowsForExport(
  rows: ContributionRow[],
  selectedFields: string[]
) {
  return rows.map((row) => {
    const obj: Record<string, any> = {};

    // Member is always included first
    obj["memberName"] = row.memberName;

    // Then include only the selected fields (excluding memberName)
    selectedFields.forEach((field) => {
      if (field !== "memberName" && field in row) {
        obj[field] = row[field as keyof typeof row];
      }
    });

    return obj;
  });
}
