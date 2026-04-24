// components/reports/ReportExportPanel.tsx
import { useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

import { Button } from "@/app/components/ui/button";
import { AttendancePreviewTable } from "./AttendancePreviewTable";
import { ContributionPreviewTable } from "./ContributionPreviewTable";
import type { ContributionBreakdownRow } from "@/app/hooks/useContributionReport";

import {
  sortAttendance,
  sortMembersByName,
} from "@/app/lib/reportSorting";

import { Member, Contribution, AttendanceRecord } from "@/app/lib/types";

interface ReportExportPanelProps {
  reportType: "members" | "contributions" | "attendance";

  filteredMembers: Member[];
  filteredContributions: Contribution[];
  filteredAttendance: AttendanceRecord[];

  selectedFY: string[];
  reportRange: "month" | "year";

  exportPDF: () => void;
  exportExcel: () => void;

  members: Member[];

  // NEW: required for ContributionPreviewTable
  selectedContributionFields: string[];
}

export function ReportExportPanel({
  reportType,
  filteredMembers,
  filteredContributions,
  filteredAttendance,
  selectedFY,
  reportRange,
  exportPDF,
  exportExcel,
  members,
  selectedContributionFields,
}: ReportExportPanelProps) {
  const contributionBreakdownRows = useMemo<ContributionBreakdownRow[]>(() => {
    const grouped = new Map<string, { totalAmount: number; contributionCount: number }>();

    filteredContributions.forEach((contribution) => {
      const key = contribution.memberName || "Unknown Member";
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          totalAmount: contribution.amount,
          contributionCount: 1,
        });
        return;
      }

      existing.totalAmount += contribution.amount;
      existing.contributionCount += 1;
    });

    return [...grouped.entries()].map(([label, value]) => ({
      key: `member:${label.toLowerCase()}`,
      label,
      totalAmount: value.totalAmount,
      contributionCount: value.contributionCount,
      averageAmount:
        value.contributionCount > 0
          ? value.totalAmount / value.contributionCount
          : 0,
    }));
  }, [filteredContributions]);

  console.log("selectedContributionFields", selectedContributionFields)
  return (
    <Card className="flex-1 w-full">
      <CardHeader>
        <CardTitle>Export</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {reportType === "members" && (
            <p>Members Selected: {filteredMembers.length}</p>
          )}

          {reportType === "contributions" && (
            <>
              <p>Contributions: {filteredContributions.length}</p>
              <p>
                Year:{" "}
                {selectedFY.length === 0
                  ? "No Year Selected"
                  : selectedFY.join(", ")}
              </p>
            </>
          )}

          {reportType === "attendance" && (
            <>
              <p>Attendance Records: {filteredAttendance.length}</p>
              <p>
                Range:{" "}
                {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}
              </p>
            </>
          )}
        </div>

        <div className="border rounded-md overflow-x-auto">
          <div className="min-w-max">
            {reportType === "attendance" && (
              <AttendancePreviewTable
                attendance={sortAttendance(filteredAttendance, members)}
                members={sortMembersByName(members)}
              />
            )}

            {reportType === "contributions" && (
              <ContributionPreviewTable
                contributions={filteredContributions}
                members={members}
                selectedFields={selectedContributionFields}
                breakdown="member"
                breakdownRows={contributionBreakdownRows}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={exportPDF}>Export PDF</Button>
          <Button onClick={exportExcel} variant="outline">
            Export Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
