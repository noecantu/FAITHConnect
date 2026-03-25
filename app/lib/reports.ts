import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, AttendanceRecord } from './types';
import { format } from 'date-fns';
import { FieldValue } from '../lib/report-types';
import { Address } from '../lib/types';
import { formatPhone } from "@/app/lib/formatters";

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
  checkInCode: "Check-In Code",
  qrCode: "QR Code",
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

export async function generateMembersPDF(
  members: Member[],
  selectedFields: string[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const orientation = selectedFields.length > 4 ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "letter",
  });

  // -----------------------------
  // 1. Preload QR images (sync-safe)
  // -----------------------------
  const qrImages: Record<string, string | null> = {};

  for (const m of members) {
    const qrUrl = m.qrCode ?? m.profilePhotoUrl ?? null; // adjust as needed

    if (!qrUrl) {
      qrImages[m.id] = null;
      continue;
    }

    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const reader = await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });

      qrImages[m.id] = reader;
    } catch {
      qrImages[m.id] = null;
    }
  }

  // -----------------------------
  // 2. Header
  // -----------------------------
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Member Directory Report", pageWidth / 2, 50, { align: "center" });

  // -----------------------------
  // 3. Table columns + rows
  // -----------------------------
  const tableColumn = ["Name", ...selectedFields.map(f => fieldLabelMap[f])];

  const tableRows = members.map(m => [
    `${m.firstName} ${m.lastName}`,
    ...selectedFields.map(f => {
      if (f === "checkInCode") return m.checkInCode ?? "—";
      if (f === "qrCode") return ""; // placeholder, image drawn later
      if (f === "phoneNumber") {
        return formatPhone(m.phoneNumber);
      }
      return formatField(m[f as keyof Member]);
    })
  ]);

  // -----------------------------
  // 4. Render table with QR images
  // -----------------------------
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 10, minCellHeight: 44 },
    tableWidth: "auto",
    columnStyles: {
      0: { cellWidth: "auto" },
      ...(selectedFields.includes("qrCode")
        ? { [selectedFields.indexOf("qrCode") + 1]: { cellWidth: 70 } }
        : {})
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },

    didDrawCell: (data) => {
      if (data.section !== "body") return;
      const qrColIndex = selectedFields.indexOf("qrCode") + 1;
      if (data.column.index !== qrColIndex) return;

      const member = members[data.row.index];
      const base64 = qrImages[member.id];
      if (!base64) return;

      const { x, y } = data.cell;
      const size = 40;

      doc.addImage(base64, "PNG", x + 2, y + 2, size, size);
    }
  });

  // -----------------------------
  // 5. Footer
  // -----------------------------
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
  rows: Record<string, any>[],     // <-- updated type
  selectedFields: string[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  // Build column headers from selected fields
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

  // Build table rows from export-ready rows
  const tableRows = rows.map(row =>
    selectedFields.map(field => {
      const value = row[field];

      if (field === "date") {
        return format(new Date(value), "MM/dd/yyyy");
      }

      if (field === "amount") {
        return `$${Number(value).toFixed(2)}`;
      }

      return value ?? "";
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
  rows: Record<string, any>[],      // <-- updated type
  selectedFields: string[]
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const worksheet = XLSX.utils.json_to_sheet(
    rows.map(row => {
      const excelRow: Record<string, string> = {};

      selectedFields.forEach(field => {
        const label = contributionFieldLabelMap[field];
        const value = row[field];

        if (field === "date") {
          excelRow[label] = format(new Date(value), "MM/dd/yyyy");
        } else if (field === "amount") {
          excelRow[label] = String(value);
        } else {
          excelRow[label] = value ?? "";
        }
      });

      return excelRow;
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
