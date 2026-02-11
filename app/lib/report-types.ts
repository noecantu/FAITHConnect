import { Address } from "./types";

export type FieldValue =
  | string
  | number
  | null
  | undefined
  | string[]
  | Address
  | { type?: string }[];
