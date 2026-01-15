'use client';

import { Form } from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "@/lib/memberForm.schema";
import type { Member } from "@/lib/types";

import { MemberInfoSection } from "@/components/member/MemberInfoSection";
import { StatusSection } from "@/components/member/StatusSection";
import { RelationshipsSection } from "@/components/member/RelationshipsSection";
import { PhotoSection } from "@/components/member/PhotoSection";

import type { FieldArrayWithId } from "react-hook-form";

type RelationshipsProps = {
  fields: FieldArrayWithId<MemberFormValues, "relationships", "id">[];
  append: (value: { relatedMemberId: string; type: string }) => void;
  remove: (index: number) => void;
  allMembers: Member[];
  availableMembers: Member[];
  relationshipOptions: string[];
};

type PhotoProps = {
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsTakingPhoto: (open: boolean) => void;
}

type MemberFormProps = {
  form: UseFormReturn<MemberFormValues>;
  onSubmit: (data: MemberFormValues) => void | Promise<void>;
  relationships: RelationshipsProps;
  photo: PhotoProps;
};

export function MemberForm({ form, onSubmit, relationships, photo }: MemberFormProps) {
  return (
    <Form {...form}>
      <form
        id="member-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pl-6 pr-4 py-4"
      >
        <MemberInfoSection form={form} />
        <StatusSection form={form} />
        <RelationshipsSection form={form} {...relationships} />
        <PhotoSection form={form} {...photo} />
      </form>
    </Form>
  );
}
