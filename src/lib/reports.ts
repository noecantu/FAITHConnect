import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, Contribution } from '@/lib/types';
import { format } from 'date-fns';

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
  selectedFields: string[]
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const doc = new jsPDF();

  const tableColumn = ["Name", ...selectedFields.map(f => fieldLabelMap[f])];
  const tableRows: any[] = [];

  members.forEach(member => {
    const row = [
      `${member.firstName} ${member.lastName}`,
      ...selectedFields.map(f => member[f as keyof Member] ?? "—")
    ];
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.text("Member Directory Report", 14, 15);
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
export function generateContributionsPDF(contributions: Contribution[]) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const doc = new jsPDF();

  const tableColumn = ["Member Name", "Date", "Amount", "Category", "Type"];
  const tableRows: any[] = [];

  contributions.forEach(c => {
    tableRows.push([
      c.memberName,
      format(new Date(c.date), 'MM/dd/yyyy'),
      `$${c.amount.toFixed(2)}`,
      c.category,
      c.contributionType,
    ]);
  });

  autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
  doc.text("Contributions Report", 14, 15);

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
