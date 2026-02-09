
import { Form } from "../../../components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../../../lib/memberForm.schema";
import type { Member } from "../../../lib/types";

import { MemberInfoSection } from "./MemberInfoSection";
import { StatusSection } from "./StatusSection";
import { RelationshipsSection } from "./RelationshipsSection";
import { PhotoSection } from "./PhotoSection";
import { LoginAccessSection } from "./LoginAccessSection";

import { useUserRoles } from "../../../hooks/useUserRoles";
import type { FieldArrayWithId } from "react-hook-form";

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../../lib/firebase";
import { useState } from "react";
import { toast } from "@/app/hooks/use-toast";

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
  member?: Member;
};

export function MemberForm({
  form,
  onSubmit,
  relationships,
  photo,
  churchId,
  member,
}: MemberFormProps) {

  const { isAdmin } = useUserRoles(churchId);
  const [isLoading, setIsLoading] = useState(false);

  const functions = getFunctions(app, "us-central1");
  const createMemberLogin = httpsCallable(functions, "createMemberLogin");
  const sendPasswordReset = httpsCallable(functions, "sendPasswordReset"); // you'll add this next

  async function handleCreateLogin() {
    if (!member || !churchId) return;
  
    setIsLoading(true);
    try {
      await createMemberLogin({
        email: form.watch("email"),
        memberId: member.id,
        churchId,
      });
    
      toast({
        title: "Login Created",
        description: "A password reset email has been sent.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create login.",
        variant: "destructive",
      });
    }
     finally {
      setIsLoading(false);
    }
  }
  
  async function handleSendReset() {
    if (!member?.userId) return;
  
    setIsLoading(true);
    try {
      await sendPasswordReset({ userId: member.userId });
    
      toast({
        title: "Reset Email Sent",
        description: "A password reset email has been sent.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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

        {/* {isAdmin && member && (
          <RolesSection
            member={member}
            onChange={(updatedRoles) => form.setValue("roles", updatedRoles)}
          />
        )} */}

        <LoginAccessSection
          hasUserAccount={!!member?.userId}
          email={form.watch("email")}
          onEmailChange={(value) => form.setValue("email", value)}
          onCreateLogin={handleCreateLogin}
          onSendReset={handleSendReset}
          isLoading={isLoading}
        />

        <PhotoSection form={form} {...photo} />
      </form>
    </Form>
  );
}
