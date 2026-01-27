'use client';

import * as z from "zod";

const relationshipSchema = z.object({
  relatedMemberId: z.string().min(1, "Member is required"),
  type: z.string().min(1, "Relationship type is required"),
  anniversary: z.string().optional(),
});

export const memberSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),

  email: z.string().email().optional().or(z.literal("")),

  phoneNumber: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Phone number must be 10 digits",
    }),

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

  relationships: z.array(relationshipSchema).default([]),

  photoFile: z
    .any()
    .optional()
    .transform((file) => (file instanceof File ? file : null)),

  // ⭐ NEW — fully supported, always an array, never undefined
  roles: z.array(z.string()).default([]),

  // These temp fields are used internally by your UI
  __temp_rel_member: z.string().optional(),
  __temp_rel_type: z.string().optional(),
});

// ⭐ TypeScript now ALWAYS matches the schema — no drift, no mismatches
export type MemberFormValues = z.infer<typeof memberSchema>;
