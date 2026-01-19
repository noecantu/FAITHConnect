import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, Contribution } from '@/lib/types';
import { format } from 'date-fns';

function formatField(value: any): string {
  if (value == null) return "—";

  // Arrays of primitives
  if (Array.isArray(value) && value.every(v => typeof v === "string")) {
    return value.join(", ");
  }

  // Address object
  if (typeof value === "object" && "street" in value) {
    const addr = value as any;
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

// ---------------------------------
// Field label map (for dynamic fields)
// ---------------------------------
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

// ---------------------------------
// Member Reports
// ---------------------------------
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

  // -------------------------
  // Header: Logo + Centered Title
  // -------------------------

  // Logo (left)
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0); // width=100, height auto
  }

  // Centered title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Member Directory Report", pageWidth / 2, 50, { align: "center" });

  // -------------------------
  // Table
  // -------------------------

  const tableColumn = ["Name", ...selectedFields.map(f => fieldLabelMap[f])];

  const tableRows = members.map(m => [
    `${m.firstName} ${m.lastName}`,
    ...selectedFields.map(f => formatField(m[f as keyof Member]))
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80, // pushed down so it doesn't overlap header
    styles: { fontSize: 10 },
    tableWidth: "auto",
    columnStyles: { 0: { cellWidth: "auto" } },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // -------------------------
  // Footer (aligned to table)
  // -------------------------

  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    const left = 40;               // autoTable default margin
    const right = pageWidth - 40;  // autoTable default margin

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
      const row: any = {
        Name: `${m.firstName} ${m.lastName}`,
      };

      selectedFields.forEach(f => {
        row[fieldLabelMap[f]] = m[f as keyof Member] ?? "";
      });

      return row;
    })
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  XLSX.writeFile(workbook, `${datePrefix} Member Directory Report.xlsx`);
}

// ---------------------------------
// Contribution Reports (UNCHANGED except footer alignment)
// ---------------------------------
export function generateContributionsPDF(contributions: Contribution[], logoBase64?: string) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const tableColumn = ["Member Name", "Date", "Amount", "Category", "Type"];
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

  const tableRows = contributions.map(c => [
    c.memberName,
    format(new Date(c.date), "MM/dd/yyyy"),
    `$${c.amount.toFixed(2)}`,
    c.category,
    c.contributionType,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 10, cellWidth: "wrap" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { cellWidth: 140 } },
  });

  // -------------------------
  // Footer (aligned to table)
  // -------------------------
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

  doc.save(`${datePrefix} Contributions Report.pdf`);
}

export function generateContributionsExcel(contributions: Contribution[]) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const worksheet = XLSX.utils.json_to_sheet(contributions.map(c => ({
    "Member Name": c.memberName,
    "Date": format(new Date(c.date), 'MM/dd/yyyy'),
    "Amount": c.amount,
    "Category": c.category,
    "Type": c.contributionType,
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contributions");

  XLSX.writeFile(workbook, `${datePrefix} Contribution Report.xlsx`);
}
