// components/reports/ReportFiltersPanel.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

import { ReportTypeSelect } from "./ReportTypeSelect";
import { MemberSelect } from "./MemberSelect";
import { MemberFieldSelect } from "./MemberFieldSelect";
import { StatusSelect } from "./StatusSelect";
import { ReportRangeSelect } from "./ReportRangeSelect";
import { YearSelect } from "./YearSelect";
import { AttendanceDateSelect } from "./AttendanceDateSelect";

import { statusOptions, memberFieldOptions } from "@/app/lib/constants/reportOptions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function ReportFiltersPanel(props: any) {
  const {
    reportType,
    setReportType,
    members,
    selectedMembers,
    setSelectedMembers,
    selectedStatus,
    setSelectedStatus,
    selectedFY,
    setSelectedFY,
    selectedFields,
    setSelectedFields,
    reportRange,
    setReportRange,
    includeVisitors,
    setIncludeVisitors,
    availableAttendanceDates,
    selectedDate,
    setSelectedDate,
    availableYears,
  } = props;

  return (
    <Card className="w-full lg:w-80 h-fit">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <ReportTypeSelect value={reportType} onChange={setReportType} />

        <MemberSelect
          members={members}
          value={selectedMembers}
          onChange={setSelectedMembers}
        />

        {reportType === "contributions" && (
          <MemberFieldSelect
            options={[
              { label: "Member", value: "memberName" },
              { label: "Amount", value: "amount" },
              { label: "Date", value: "date" },
              { label: "Category", value: "category" },
              { label: "Type", value: "contributionType" },
              { label: "Notes", value: "notes" },
            ]}
            value={selectedFields}
            onChange={setSelectedFields}
          />
        )}

        {reportType === "attendance" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Include Visitors
            </label>

            <Select
              value={includeVisitors ? "yes" : "no"}
              onValueChange={(v) => setIncludeVisitors(v === "yes")}
            >
              <SelectTrigger className="bg-black/20 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {reportType === "members" && (
          <StatusSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        )}

        {(reportType === "contributions" || reportType === "attendance") && (
          <ReportRangeSelect value={reportRange} onChange={setReportRange} />
        )}

        {reportType === "contributions" && (
          <YearSelect
            years={availableYears}
            value={selectedFY}
            onChange={setSelectedFY}
          />
        )}

        {reportType === "members" && (
          <MemberFieldSelect
            options={memberFieldOptions}
            value={selectedFields}
            onChange={setSelectedFields}
          />
        )}

        {reportType === "attendance" && (
          <AttendanceDateSelect
            availableDates={availableAttendanceDates}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        )}
      </CardContent>
    </Card>
  );
}
