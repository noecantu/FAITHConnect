"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/app/components/ui/form";
import { toast } from "@/app/hooks/use-toast";

import { MemberInfoSection } from "./MemberInfoSection";
import { StatusSection } from "./StatusSection";
import { RelationshipsSection } from "./RelationshipsSection";
import { PhotoSection } from "./PhotoSection";

import { db } from "@/app/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import type { Member } from "@/app/lib/types";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import { memberSchema } from "@/app/lib/memberForm.schema";

import { useMemberRelationships } from "@/app/hooks/useMemberRelationships";
import { usePhotoCapture } from "@/app/hooks/usePhotoCapture";
import { Fab } from "@/app/components/ui/fab";

export interface StandaloneMemberFormProps {
  churchId: string;
  member?: Member;
  onSuccess?: (id: string) => void;
}

export default function MemberForm({
  churchId,
  member,
  onSuccess,
}: StandaloneMemberFormProps) {
  const isEditing = !!member;

  // FORM SETUP
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ?? {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      birthday: "",
      baptismDate: "",
      anniversary: "",
      status: "Active",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
      notes: "",
      relationships: [],
      photoFile: null,
      roles: [],
      __temp_rel_member: "",
      __temp_rel_type: "",
    }
  });

  // RELATIONSHIPS HOOK
  const relationships = useMemberRelationships({
    form,
    member,
    isEditMode: isEditing,
  });

  // PHOTO HOOK
  const photo = usePhotoCapture({
    form,
    member,
    isOpen: true, // standalone form is always open
    initialUrl: member?.profilePhotoUrl ?? null,
  });

  // FIREBASE FUNCTIONS
  const [isLoading, setIsLoading] = useState(false);

  // SUBMIT HANDLER
  async function onSubmit(values: MemberFormValues) {
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateDoc(
          doc(db, "churches", churchId, "members", member!.id),
          {
            ...values,
            updatedAt: serverTimestamp(),
          }
        );

        onSuccess?.(member!.id);
      } else {
        const newId = crypto.randomUUID();

        await setDoc(
          doc(db, "churches", churchId, "members", newId),
          {
            id: newId,
            churchId,
            ...values,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        onSuccess?.(newId);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save member.",
        // variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // RENDER
  return (
    <Form {...form}>
      <form
        id="member-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pl-6 pr-4 py-4"
      >
        <MemberInfoSection form={form} />
        <StatusSection form={form} />

        <RelationshipsSection
          allMembers={[]} currentMemberId={""} form={form}
          {...relationships}        />

        <PhotoSection form={form} {...photo} />

        <Fab
          type="save"
          disabled={isLoading}
          onClick={() => {
            const formEl = document.getElementById("member-form") as HTMLFormElement;
            formEl?.requestSubmit();
          }}
        />
      </form>
    </Form>
  );
}
