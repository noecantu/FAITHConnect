import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, Contribution } from '@/lib/types';
import { format } from 'date-fns';

// ---------------------------------
// Member Reports
// ---------------------------------
export function generateMembersPDF(members: Member[]) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const doc = new jsPDF();
  const tableColumn = ["Name", "Email", "Phone Number", "Status"];
  const tableRows: any[] = [];

  members.forEach(member => {
    const memberData = [
      `${member.firstName} ${member.lastName}`,
      member.email || 'N/A',
      member.phoneNumber,
      member.status,
    ];
    tableRows.push(memberData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });
  doc.text("Member Directory Report", 14, 15);
  doc.save(`${datePrefix}_Member Directory Report.pdf`);
}

export function generateMembersExcel(members: Member[]) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");
  const worksheet = XLSX.utils.json_to_sheet(members.map(m => ({
    "First Name": m.firstName,
    "Last Name": m.lastName,
    "Email": m.email,
    "Phone Number": m.phoneNumber,
    "Status": m.status,
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  XLSX.writeFile(workbook, `${datePrefix} Member Directory Report.xlsx`);
}

// ---------------------------------
// Contribution Reports
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
