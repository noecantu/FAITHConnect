'use client';

import { Form } from "../../components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../../lib/memberForm.schema";
import type { Member } from "../../lib/types";
import { MemberInfoSection } from "./MemberInfoSection";
import { StatusSection } from "./StatusSection";
import { RelationshipsSection } from "./RelationshipsSection";
import { PhotoSection } from "./PhotoSection";
import { RolesSection } from "../roles-section";
import { useUserRoles } from "../../hooks/useUserRoles";
import type { FieldArrayWithId } from "react-hook-form";
import { LoginAccessSection } from "./LoginAccessSection";

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
};

type MemberFormProps = {
  form: UseFormReturn<MemberFormValues>;
  onSubmit: (data: MemberFormValues) => void | Promise<void>;
  relationships: RelationshipsProps;
  photo: PhotoProps;
  churchId: string | null;
  member?: Member; // <-- you already added this correctly
};

export function MemberForm({
  form,
  onSubmit,
  relationships,
  photo,
  churchId,
  member,          // <-- you forgot to destructure this
}: MemberFormProps) {

  const { isAdmin } = useUserRoles(churchId);

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

        {isAdmin && member && (
          <RolesSection
            member={member}
            onChange={(updatedRoles) => form.setValue("roles", updatedRoles)}
          />
        )}

        <LoginAccessSection
          hasUserAccount={!!member?.id}
          email={form.watch("email")}
          onEmailChange={(value) => form.setValue("email", value)}
          onCreateLogin={() => {
            // TODO: trigger Cloud Function to create login
          }}
          onSendReset={() => {
            // TODO: trigger password reset email
          }}
          isLoading={false} // TODO: wire loading state
        />

        <PhotoSection form={form} {...photo} />
      </form>
    </Form>
  );
}
