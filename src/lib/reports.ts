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
  // Logo (optional)
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 20, 10, 50, 50);
  }
  doc.setFontSize(18);
  doc.text("Member Directory Report", 80, 40);
  const tableColumn = ["Name", ...selectedFields.map(f => fieldLabelMap[f])];
  const tableRows = members.map(m => [
    `${m.firstName} ${m.lastName}`,
    ...selectedFields.map(f => formatField(m[f as keyof Member]))
  ]);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    styles: {
      fontSize: 10,
    },
    tableWidth: "auto",
    columnStyles: {
      0: { cellWidth: "auto" },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });  

  // Footer + Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer date
    doc.setFontSize(10);
    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`,
      20,
      doc.internal.pageSize.getHeight() - 20
    );

    // Page number
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 60,
      doc.internal.pageSize.getHeight() - 20
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
// Contribution Reports (UNCHANGED)
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
    doc.addImage(logoBase64, "PNG", 20, 10, 50, 50);
  }

  doc.setFontSize(18);
  doc.text("Contributions Report", 80, 40);

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
    startY: 60,
    styles: {
      fontSize: 10,
      cellWidth: "wrap",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 140 }, // Member Name wider
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(10);
    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`,
      20,
      doc.internal.pageSize.getHeight() - 20
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 60,
      doc.internal.pageSize.getHeight() - 20
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
