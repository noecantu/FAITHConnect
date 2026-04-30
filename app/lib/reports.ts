import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Member, AttendanceRecord, SetList, ServicePlan, Song } from './types';
import { format } from 'date-fns';
import { FieldValue } from '../lib/report-types';
import { Address } from '../lib/types';
import { formatCurrencyUSD, formatPhone } from "@/app/lib/formatters";

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

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
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
    if (!logoBase64.startsWith("data:image/")) {
      console.error("Logo is not an image:", logoBase64.substring(0, 50));
    } else {
      doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
    }

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
      if (f === "qrCode") return "";
      if (f === "phoneNumber") {
        return formatPhone(m.phoneNumber);
      }
      if (["birthday", "baptismDate", "anniversary"].includes(f)) {
        const value = m[f as keyof Member];
        return value ? format(new Date(value as any), "MM/dd/yyyy") : "—";
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

      const isPng = base64.startsWith("data:image/png");
      const isJpg = base64.startsWith("data:image/jpeg");

      if (isPng) {
        doc.addImage(base64, "PNG", x + 2, y + 2, size, size);
      } else if (isJpg) {
        doc.addImage(base64, "JPEG", x + 2, y + 2, size, size);
      }
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
        if (f === "qrCode") return;
        const label = fieldLabelMap[f] ?? capitalize(f);
        const value = m[f as keyof Member];

        row[label] = value != null ? formatField(value as any) : "";
      });

      return row;
    })
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  XLSX.writeFile(workbook, `${datePrefix} Member Directory Report.xlsx`);
}

export function generateContributionsPDF(
  rows: Record<string, any>[],     // <-- updated type
  selectedFields: string[],
  logoBase64?: string,
  options?: { contextLines?: string[]; fieldLabelOverrides?: Record<string, string> }
) {
  const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/[^0-9.-]/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const datePrefix = format(new Date(), "yyyy-MM-dd");

  // Build column headers from selected fields
  const tableColumn = selectedFields.map(
    (f) => options?.fieldLabelOverrides?.[f] ?? contributionFieldLabelMap[f] ?? capitalize(f)
  );

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

  const contextLines = options?.contextLines ?? [];
  let tableStartY = 80;

  if (contextLines.length > 0) {
    doc.setFontSize(10);
    contextLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, 68 + index * 12, { align: "center" });
    });
    tableStartY = 68 + contextLines.length * 12 + 10;
  }

  // Build table rows from export-ready rows
  const tableRows = rows.map(row =>
    selectedFields.map(field => {
      const value = row[field];

      if (field === "date" && value) {
        return format(new Date(value), "MM/dd/yyyy");
      }

      if (field === "amount" || field === "totalAmount" || field === "averageAmount") {
        return formatCurrencyUSD(toNumber(value));
      }

      if (field === "contributionCount") {
        return String(Number(value) || 0);
      }

      return value ?? "";
    })
  );

  const totalField = selectedFields.includes("amount")
    ? "amount"
    : selectedFields.includes("totalAmount")
    ? "totalAmount"
    : null;

  if (totalField) {
    const totalAmount = rows.reduce((sum, row) => {
      return sum + toNumber(row[totalField]);
    }, 0);

    const totalRow = selectedFields.map((field, index) => {
      if (field === totalField) return formatCurrencyUSD(totalAmount);
      if (field === "memberName" || field === "group") return "TOTAL";
      if (index === 0 && !selectedFields.includes("memberName") && !selectedFields.includes("group")) {
        return "TOTAL";
      }
      return "";
    });

    tableRows.push(totalRow);
  }

  const totalRowIndex = totalField ? tableRows.length - 1 : -1;
  const columnStyles: Record<number, { halign?: "left" | "center" | "right" }> = {};

  selectedFields.forEach((field, index) => {
    if (["amount", "totalAmount", "averageAmount"].includes(field)) {
      columnStyles[index] = { halign: "right" };
    } else if (field === "contributionCount") {
      columnStyles[index] = { halign: "center" };
    }
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    styles: { fontSize: 10, cellWidth: "wrap" },
    headStyles: { fontStyle: "bold", fillColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles,
    didParseCell: (hookData) => {
      if (
        totalRowIndex >= 0 &&
        hookData.section === "body" &&
        hookData.row.index === totalRowIndex
      ) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [255, 255, 255];
        hookData.cell.styles.lineColor = [148, 163, 184];
        (hookData.cell.styles as any).lineWidth = {
          top: 1,
          right: 0,
          bottom: 0,
          left: 0,
        };
      }
    },
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
  selectedFields: string[],
  options?: { contextLines?: string[]; fieldLabelOverrides?: Record<string, string> }
) {
  const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/[^0-9.-]/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const contextLines = options?.contextLines ?? [];
  const exportRows = rows.map(row => {
    const excelRow: Record<string, string> = {};

    selectedFields.forEach(field => {
      const label =
        options?.fieldLabelOverrides?.[field] ?? contributionFieldLabelMap[field] ?? capitalize(field);
      const value = row[field];

      if (field === "date" && value) {
        excelRow[label] = format(new Date(value), "MM/dd/yyyy");
      } else if (field === "amount" || field === "totalAmount" || field === "averageAmount") {
        excelRow[label] = formatCurrencyUSD(toNumber(value));
      } else if (field === "contributionCount") {
        excelRow[label] = String(toNumber(value));
      } else {
        excelRow[label] = value ?? "";
      }
    });

    return excelRow;
  });

  const totalField = selectedFields.includes("amount")
    ? "amount"
    : selectedFields.includes("totalAmount")
    ? "totalAmount"
    : null;

  if (totalField) {
    const totalAmount = rows.reduce((sum, row) => {
      return sum + toNumber(row[totalField]);
    }, 0);

    const totalRow: Record<string, string> = {};

    selectedFields.forEach((field, index) => {
      const label =
        options?.fieldLabelOverrides?.[field] ?? contributionFieldLabelMap[field] ?? capitalize(field);
      totalRow[label] = "";

      if (field === totalField) {
        totalRow[label] = formatCurrencyUSD(totalAmount);
      }

      if (field === "memberName" || field === "group") {
        totalRow[label] = "TOTAL";
      } else if (index === 0 && !selectedFields.includes("memberName") && !selectedFields.includes("group")) {
        totalRow[label] = "TOTAL";
      }
    });

    exportRows.push(totalRow);
  }

  const worksheet = XLSX.utils.aoa_to_sheet([]);

  if (contextLines.length > 0) {
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Report Context"], ...contextLines.map((line) => [line]), [""]],
      { origin: "A1" }
    );
  }

  XLSX.utils.sheet_add_json(worksheet, exportRows, {
    origin: contextLines.length > 0 ? `A${contextLines.length + 3}` : "A1",
  });

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

export function generateSetListPDF(setList: SetList, logoBase64?: string) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Set List Report", pageWidth / 2, 50, { align: "center" });

  doc.setFontSize(12);
  doc.text(setList.title, 40, 90);
  doc.setFontSize(10);
  doc.text(`Service Date: ${format(setList.dateTime, "MM/dd/yyyy h:mm a")}`, 40, 108);

  const overviewLines: string[] = [];
  if (setList.serviceType) overviewLines.push(`Service Type: ${setList.serviceType}`);
  if (setList.serviceNotes?.theme) overviewLines.push(`Theme: ${setList.serviceNotes.theme}`);
  if (setList.serviceNotes?.scripture) {
    const scriptureLine = setList.serviceNotes?.scriptureTranslation
      ? `Scripture: ${setList.serviceNotes.scripture} (${setList.serviceNotes.scriptureTranslation})`
      : `Scripture: ${setList.serviceNotes.scripture}`;
    overviewLines.push(scriptureLine);
  }
  if (setList.serviceNotes?.scriptureText) overviewLines.push(`Verse: ${setList.serviceNotes.scriptureText}`);
  if (setList.serviceNotes?.notes) overviewLines.push(`Notes: ${setList.serviceNotes.notes}`);

  if (overviewLines.length > 0) {
    doc.setFontSize(10);
    overviewLines.forEach((line, index) => {
      const y = 126 + index * 14;
      const wrapped = doc.splitTextToSize(line, pageWidth - 80);
      doc.text(wrapped, 40, y);
    });
  }

  const tableStartY = overviewLines.length > 0 ? 126 + overviewLines.length * 14 + 18 : 130;

  const rows: Array<string[]> = [];
  setList.sections.forEach((section) => {
    if (section.songs.length === 0) {
      rows.push([section.title, "-", "-", "-", "No songs in this section"]);
      return;
    }

    section.songs.forEach((song, index) => {
      rows.push([
        index === 0 ? section.title : "",
        song.title ?? "-",
        song.key ?? "-",
        song.bpm != null ? String(song.bpm) : "-",
        song.notes ?? "",
      ]);
    });
  });

  autoTable(doc, {
    head: [["Section", "Song", "Key", "BPM", "Notes"]],
    body: rows,
    startY: tableStartY,
    styles: { fontSize: 9, cellWidth: "wrap", valign: "top" },
    headStyles: { fontStyle: "bold", fillColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 180 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50, halign: "center" },
      4: { cellWidth: 150 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const footerY = height - 20;

    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`, 40, footerY);
    doc.text(`Page ${i} of ${pageCount}`, width - 40, footerY, { align: "right" });
  }

  doc.save(`${datePrefix} ${setList.title} Set List Report.pdf`);
}

export function generateSetListExcel(setList: SetList) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const summaryRows = [
    { Field: "Title", Value: setList.title },
    { Field: "Service Date", Value: format(setList.dateTime, "MM/dd/yyyy h:mm a") },
    { Field: "Service Type", Value: setList.serviceType ?? "" },
    { Field: "Theme", Value: setList.serviceNotes?.theme ?? "" },
    { Field: "Scripture", Value: setList.serviceNotes?.scripture ?? "" },
    { Field: "Scripture Translation", Value: setList.serviceNotes?.scriptureTranslation ?? "" },
    { Field: "Scripture Text", Value: setList.serviceNotes?.scriptureText ?? "" },
    { Field: "Notes", Value: setList.serviceNotes?.notes ?? "" },
  ];

  const songRows = setList.sections.flatMap((section) => {
    if (section.songs.length === 0) {
      return [{
        Section: section.title,
        Song: "",
        Key: "",
        BPM: "",
        Notes: "No songs in this section",
      }];
    }

    return section.songs.map((song) => ({
      Section: section.title,
      Song: song.title ?? "",
      Key: song.key ?? "",
      BPM: song.bpm ?? "",
      Notes: song.notes ?? "",
    }));
  });

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Set List Overview");

  const songsSheet = XLSX.utils.json_to_sheet(songRows);
  XLSX.utils.book_append_sheet(workbook, songsSheet, "Set List Songs");

  XLSX.writeFile(workbook, `${datePrefix} ${setList.title} Set List Report.xlsx`);
}

export function generateServicePlanPDF(
  servicePlan: ServicePlan,
  members: Member[],
  songs: Song[],
  logoBase64?: string
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 20, 100, 0);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text("Service Plan Report", pageWidth / 2, 50, { align: "center" });

  doc.setFontSize(12);
  doc.text(servicePlan.title, 40, 90);
  doc.setFontSize(10);
  doc.text(`Service Date: ${format(servicePlan.dateTime, "MM/dd/yyyy h:mm a")}`, 40, 108);

  const hasTheme = typeof servicePlan.theme === "string" && servicePlan.theme.trim().length > 0;
  const hasScripture = typeof servicePlan.scripture === "string" && servicePlan.scripture.trim().length > 0;
  const hasScriptureTranslation = typeof servicePlan.scriptureTranslation === "string" && servicePlan.scriptureTranslation.trim().length > 0;
  const hasScriptureText = typeof servicePlan.scriptureText === "string" && servicePlan.scriptureText.trim().length > 0;
  const hasNotes = servicePlan.notes.trim().length > 0;
  let metadataY = 126;
  if (hasTheme) {
    doc.text(`Theme: ${servicePlan.theme}`, 40, metadataY);
    metadataY += 12;
  }
  if (hasScripture) {
    const scriptureLabel = hasScriptureTranslation
      ? `Scripture: ${servicePlan.scripture} (${servicePlan.scriptureTranslation})`
      : `Scripture: ${servicePlan.scripture}`;
    doc.text(scriptureLabel, 40, metadataY);
    metadataY += 12;
  }

  if (hasScriptureText) {
    const wrappedScripture = doc.splitTextToSize(`Verse: ${servicePlan.scriptureText}`, pageWidth - 80);
    doc.text(wrappedScripture, 40, metadataY);
    metadataY += wrappedScripture.length * 12 + 4;
  }

  let tableStartY = metadataY + 4;
  if (hasNotes) {
    const wrapped = doc.splitTextToSize(`Service Notes: ${servicePlan.notes}`, pageWidth - 80);
    doc.text(wrapped, 40, metadataY);
    tableStartY = metadataY + wrapped.length * 12 + 12;
  }

  const rows: Array<string[]> = [];
  servicePlan.sections.forEach((section) => {
    const member = members.find((m) => m.id === section.personId);
    const personName = section.personName?.trim()
      ? section.personName.trim()
      : section.personId
        ? member
          ? `${member.firstName} ${member.lastName}`
          : "Unknown Member"
        : "";

    const timing = [
      section.startTime?.trim() ? section.startTime.trim() : null,
      typeof section.durationMinutes === "number" ? `${section.durationMinutes} min` : null,
    ].filter((part): part is string => Boolean(part)).join(" | ");

    if (section.songIds.length === 0) {
      rows.push([section.title, personName, timing, "No songs", section.notes ?? ""]);
      return;
    }

    section.songIds.forEach((songId, index) => {
      const song = songs.find((s) => s.id === songId);
      rows.push([
        index === 0 ? section.title : "",
        index === 0 ? personName : "",
        index === 0 ? timing : "",
        song ? song.title : "Unknown Song",
        index === 0 ? (section.notes ?? "") : "",
      ]);
    });
  });

  autoTable(doc, {
    head: [["Section", "Person", "Timing", "Music", "Section Notes"]],
    body: rows,
    startY: tableStartY,
    styles: { fontSize: 9, cellWidth: "wrap", valign: "top" },
    headStyles: { fontStyle: "bold", fillColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 90 },
      2: { cellWidth: 85 },
      3: { cellWidth: 130 },
      4: { cellWidth: 130 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const footerY = height - 20;

    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), "MM/dd/yyyy hh:mm a")}`, 40, footerY);
    doc.text(`Page ${i} of ${pageCount}`, width - 40, footerY, { align: "right" });
  }

  doc.save(`${datePrefix} ${servicePlan.title} Service Plan Report.pdf`);
}

export function generateServicePlanExcel(
  servicePlan: ServicePlan,
  members: Member[],
  songs: Song[]
) {
  const datePrefix = format(new Date(), "yyyy-MM-dd");

  const summaryRows = [
    { Field: "Title", Value: servicePlan.title },
    { Field: "Service Date", Value: format(servicePlan.dateTime, "MM/dd/yyyy h:mm a") },
    { Field: "Theme", Value: servicePlan.theme ?? "" },
    { Field: "Scripture", Value: servicePlan.scripture ?? "" },
    { Field: "Scripture Translation", Value: servicePlan.scriptureTranslation ?? "" },
    { Field: "Scripture Text", Value: servicePlan.scriptureText ?? "" },
    { Field: "Service Notes", Value: servicePlan.notes ?? "" },
  ];

  const sectionRows = servicePlan.sections.flatMap((section) => {
    const member = members.find((m) => m.id === section.personId);
    const personName = section.personName?.trim()
      ? section.personName.trim()
      : section.personId
        ? member
          ? `${member.firstName} ${member.lastName}`
          : "Unknown Member"
        : "";

    const timing = [
      section.startTime?.trim() ? section.startTime.trim() : null,
      typeof section.durationMinutes === "number" ? `${section.durationMinutes} min` : null,
    ].filter((part): part is string => Boolean(part)).join(" | ");

    if (section.songIds.length === 0) {
      return [{
        Section: section.title,
        Person: personName,
        Timing: timing,
        Music: "No songs",
        SectionNotes: section.notes ?? "",
      }];
    }

    return section.songIds.map((songId, index) => {
      const song = songs.find((s) => s.id === songId);
      return {
        Section: index === 0 ? section.title : "",
        Person: index === 0 ? personName : "",
        Timing: index === 0 ? timing : "",
        Music: song ? song.title : "Unknown Song",
        SectionNotes: index === 0 ? (section.notes ?? "") : "",
      };
    });
  });

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Service Plan Overview");

  const sectionsSheet = XLSX.utils.json_to_sheet(sectionRows);
  XLSX.utils.book_append_sheet(workbook, sectionsSheet, "Service Plan Sections");

  XLSX.writeFile(workbook, `${datePrefix} ${servicePlan.title} Service Plan Report.xlsx`);
}
