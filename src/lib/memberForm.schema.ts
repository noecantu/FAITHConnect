'use client';

import * as z from "zod";

export type MemberFormValues = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  birthday?: string;
  baptismDate?: string;
  anniversary?: string;
  status: "Active" | "Prospect" | "Archived";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  notes?: string;
  photoFile?: File | null;
  relationships?: {
  relatedMemberId: string;
  type: string;
  anniversary?: string;
  }[];
  __temp_rel_member?: string;
  __temp_rel_type?: string;
};

const relationshipSchema = z.object({
  relatedMemberId: z.string().min(1, "Member is required"),
  type: z.string().min(1, "Relationship type is required"),
});

export const memberSchema: z.ZodType<MemberFormValues> = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().min(1, "Phone is required"),
  birthday: z.string().optional(),
  baptismDate: z.string().optional(),
  anniversary: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Archived"]),
  relationships: z.array(relationshipSchema).optional(),
  photoFile: z
    .any()
    .optional()
    .transform((file) => (file instanceof File ? file : null)),
});
