import { Address } from "./types";

export type FieldValue =
  | string
  | number
  | null
  | undefined
  | string[]
  | Address
  | { type?: string }[];

// Member field options
export const memberFieldOptions = [
  { value: "email", label: "Email" },
  { value: "phoneNumber", label: "Phone Number" },
  { value: "birthday", label: "Birthday" },
  { value: "baptismDate", label: "Baptism Date" },
  { value: "anniversary", label: "Anniversary" },
  { value: "address", label: "Address" },
  { value: "notes", label: "Notes" },
  { value: "roles", label: "Roles" },
];

// Contribution field options
export const contributionFieldOptions = [
  { value: "memberName", label: "Member" },
  { value: "amount", label: "Amount" },
  { value: "date", label: "Date" },
  { value: "category", label: "Category" },
  { value: "contributionType", label: "Type" },
  { value: "notes", label: "Notes" },
];
