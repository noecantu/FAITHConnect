// constants/reportOptions.ts
export const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Prospect", value: "Prospect" },
  { label: "Archived", value: "Archived" },
];

export const memberFieldOptions = [
  { label: "Status", value: "status" },
  { label: "Email", value: "email" },
  { label: "Phone Number", value: "phoneNumber" },
  { label: "Birthday", value: "birthday" },
  { label: "Baptism Date", value: "baptismDate" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Address", value: "address" },
  { label: "Check-In Code", value: "checkInCode" },
  { label: "QR Code", value: "qrCode" },
  { label: "Notes", value: "notes" },
];

export const fieldLabelMap: Record<string, string> = {
  status: "Status",
  email: "Email",
  phoneNumber: "Phone Number",
  birthday: "Birthday",
  baptismDate: "Baptism Date",
  anniversary: "Anniversary",
  address: "Address",
  checkInCode: "Check-In Code",
  qrCode: "QR Code",
  notes: "Notes",
};
