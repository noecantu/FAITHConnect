import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, Contribution, AttendanceRecord } from './types';
import { format } from 'date-fns';
import { FieldValue } from '../lib/report-types';
import { Address } from '../lib/types';

function formatField(value: FieldValue): string {
  if (value == null) return "—";

  // Arrays of primitives
  if (Array.isArray(value) && value.every(v => typeof v === "string")) {
    return value.join(", ");
  }

  // Address object
  if (typeof value === "object" && "street" in value) {
    const addr = value as Address;
    return [
      addr.street,
      addr.city,
      addr.state,
      addr.zip
    ].filter(Boolean).join(", ");
  }

  // Array of Relationship objects
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
    return value.map(r => r.type ?? "—").join(", ");
  }

  // Fallback for primitives
  return String(value);
}

// Field label map (for dynamic fields)
const fieldLabelMap: Record<string, string> = {
  email: "Email",
  phoneNumber: "Phone Number",
  birthday: "Birthday",
  baptismDate: "Baptism Date",
  anniversary: "Anniversary",
  address: "Address",
  notes: "Notes",
  roles: "Roles",
};

// Contribution field labels
const contributionFieldLabelMap: Record<string, string> = {
  memberName: "Member Name",
  date: "Date",
  amount: "Amount",
  category: "Category",
  contributionType: "Type",
  notes: "Notes",
};

// Member Reports
export function generateMembersPDF(
  members: Member[],
  selectedFields: string[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const orientation =
    selectedFields.length > 4 ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "letter",
  });

  // Header: Logo + Centered Title
  // Logo (left)
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0); // width=100, height auto
  }

  // Centered title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Member Directory Report", pageWidth / 2, 50, { align: "center" });

  // Table
  const tableColumn = ["Name", ...selectedFields.map(f => fieldLabelMap[f])];

  const tableRows = members.map(m => [
    `${m.firstName} ${m.lastName}`,
    ...selectedFields.map(f => formatField(m[f as keyof Member]))
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 10 },
    tableWidth: "auto",
    columnStyles: { 0: { cellWidth: "auto" } },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Footer (aligned to table)
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    const left = 40;
    const right = pageWidth - 40;

    doc.setFontSize(10);

    // Left footer text
    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`,
      left,
      footerY
    );

    // Right footer text
    doc.text(
      `Page ${i} of ${pageCount}`,
      right,
      footerY,
      { align: "right" }
    );
  }

  doc.save(`${datePrefix}_Member Directory Report.pdf`);
}

export function generateMembersExcel(
  members: Member[],
  selectedFields: string[]
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const worksheet = XLSX.utils.json_to_sheet(
    members.map(m => {
      const row: Record<string, string> = {
        Name: `${m.firstName} ${m.lastName}`,
      };

      selectedFields.forEach(f => {
        const label = fieldLabelMap[f];
        const value = m[f as keyof Member];

        row[label] = value != null ? String(value) : "";
      });

      return row;
    })
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  XLSX.writeFile(workbook, `${datePrefix} Member Directory Report.xlsx`);
}

// Contribution Reports (UNCHANGED except footer alignment)
export function generateContributionsPDF(
  contributions: Contribution[],
  selectedFields: string[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const tableColumn = selectedFields.map(f => contributionFieldLabelMap[f]);

  const orientation = tableColumn.length > 4 ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "letter",
  });

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Contributions Report", pageWidth / 2, 50, { align: "center" });

  const tableRows = contributions.map(c =>
    selectedFields.map(f => {
      if (f === "date") return format(new Date(c.date), "MM/dd/yyyy");
      if (f === "amount") return `$${c.amount.toFixed(2)}`;
      return formatField(c[f as keyof Contribution]);
    })
  );

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 10, cellWidth: "wrap" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    doc.setFontSize(10);

    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`,
      40,
      footerY
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 40,
      footerY,
      { align: "right" }
    );
  }

  doc.save(`${datePrefix} Contributions Report.pdf`);
}

export function generateContributionsExcel(
  contributions: Contribution[],
  selectedFields: string[]
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const worksheet = XLSX.utils.json_to_sheet(
    contributions.map(c => {
      const row: Record<string, string> = {};

      selectedFields.forEach(f => {
        const label = contributionFieldLabelMap[f];

        if (f === "date") {
          row[label] = format(new Date(c.date), "MM/dd/yyyy");
        } else if (f === "amount") {
          row[label] = String(c.amount);
        } else {
          row[label] = formatField(c[f as keyof Contribution]);
        }
      });

      return row;
    })
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contributions");

  XLSX.writeFile(workbook, `${datePrefix} Contribution Report.xlsx`);
}

export function generateAttendancePDF(
  records: AttendanceRecord[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const tableColumn = ["Date", "Name", "Type", "Status"];
  const orientation = tableColumn.length > 4 ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "letter",
  });

  // Header: Logo + Centered Title
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Attendance Report", pageWidth / 2, 50, { align: "center" });

  // Table rows
  const tableRows = records.map(r => [
    format(new Date(r.date), "MM/dd/yyyy"),
    r.memberName ?? r.visitorName ?? "Unknown",
    r.memberId ? "Member" : "Visitor",
    "Present",
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 10, cellWidth: "wrap" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 1: { cellWidth: 140 } },
  });

  // Footer (aligned to table)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    const left = 40;
    const right = pageWidth - 40;

    doc.setFontSize(10);

    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`,
      left,
      footerY
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      right,
      footerY,
      { align: "right" }
    );
  }

  doc.save(`${datePrefix} Attendance Report.pdf`);
}

export function generateAttendanceExcel(records: AttendanceRecord[]) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const worksheet = XLSX.utils.json_to_sheet(
    records.map(r => ({
      Date: format(new Date(r.date), "MM/dd/yyyy"),
      Name: r.memberName ?? r.visitorName ?? "Unknown",
      Type: r.memberId ? "Member" : "Visitor",
      Status: "Present",
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  XLSX.writeFile(workbook, `${datePrefix} Attendance Report.xlsx`);
}
