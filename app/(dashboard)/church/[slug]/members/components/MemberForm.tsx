"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";

import { db } from "@/app/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import type { Member } from "@/app/lib/types";

//
// VALIDATION SCHEMA
//
const MemberSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Archived"]).default("Active"),
});

export type MemberFormValues = z.infer<typeof MemberSchema>;

//
// PROPS
//
export interface MemberFormProps {
  churchId: string;
  member?: Member;
  onSuccess?: (newMemberId: string) => void;
}

//
// COMPONENT
//
export default function MemberForm({
  churchId,
  member,
  onSuccess,
}: MemberFormProps) {
  const isEditing = !!member;

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberSchema),
    defaultValues: {
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      email: member?.email ?? "",
      phoneNumber: member?.phoneNumber ?? "",
      birthday: member?.birthday ?? "",
      anniversary: member?.anniversary ?? "",
      status: member?.status ?? "Active",
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  //
  // SUBMIT HANDLER
  //
  async function handleSubmit(values: MemberFormValues) {
    if (!churchId) return;

    setIsSaving(true);

    try {
      if (isEditing) {
        // UPDATE EXISTING MEMBER
        await updateDoc(
          doc(db, "churches", churchId, "members", member!.id),
          {
            ...values,
            updatedAt: serverTimestamp(),
          }
        );

        onSuccess?.(member!.id);
      } else {
        // CREATE NEW MEMBER
        const newId = crypto.randomUUID();

        await setDoc(
          doc(db, "churches", churchId, "members", newId),
          {
            id: newId,
            churchId,
            ...values,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            relationships: [],
            profilePhotoUrl: "",
          }
        );

        onSuccess?.(newId);
      }
    } catch (err) {
      console.error("Error saving member:", err);
    } finally {
      setIsSaving(false);
    }
  }

  //
  // UI
  //
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* FIRST NAME */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input {...form.register("firstName")} />
            {form.formState.errors.firstName && (
              <p className="text-red-600 text-sm">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>

          {/* LAST NAME */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input {...form.register("lastName")} />
            {form.formState.errors.lastName && (
              <p className="text-red-600 text-sm">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>

          {/* PHONE */}
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input {...form.register("phoneNumber")} />
          </div>

          {/* BIRTHDAY */}
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Input type="date" {...form.register("birthday")} />
          </div>

          {/* ANNIVERSARY */}
          <div className="space-y-2">
            <Label>Anniversary</Label>
            <Input type="date" {...form.register("anniversary")} />
          </div>

          {/* STATUS */}
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              {...form.register("status")}
              className="border rounded-md p-2 w-full bg-background"
            >
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* SUBMIT */}
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
