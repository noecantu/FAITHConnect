//app/components/members/MemberForm.tsx
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
import type { Member } from "@/app/lib/types";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import { memberSchema } from "@/app/lib/memberForm.schema";
import { useMemberRelationships } from "@/app/hooks/useMemberRelationships";
import { usePhotoCapture } from "@/app/hooks/usePhotoCapture";
import QRCode from "qrcode";
import { generateCheckInCode } from "@/app/lib/utils/generateCheckInCode";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";

import { Button } from "@/app/components/ui/button";
import { Fab } from "@/app/components/ui/fab";
import { Check, Trash, QrCode, FileUser } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteMember } from "@/app/lib/deleteMember";
import { addMember, updateMember } from "@/app/lib/members";
import { CheckInCodeSection } from "./CheckInCodeSection";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const parts = [maybe.message, maybe.code, maybe.details]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);

    if (parts.length > 0) return parts.join(" | ");
  }

  return "Failed to save member.";
}

/* -------------------------------------------------------
   FAB MENU COMPONENT
------------------------------------------------------- */
function MemberFabMenu({
  isEditing,
  member,
  churchId,
  form,
  isLoading,
  readOnly = false,
  onSubmit,
}: {
  isEditing: boolean;
  member?: Member;
  churchId: string;
  form: any;
  isLoading: boolean;
  readOnly?: boolean;
  onSubmit: () => void;
}) {
  if (readOnly) return null;
  const router = useRouter();
  const [showCheckInCode, setShowCheckInCode] = useState(false);

  function downloadQR(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "member-qr.png";
    link.click();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Fab type="menu" disabled={isLoading} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="end"
          className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/20 p-1"
        >
          {/* SAVE */}
          <DropdownMenuItem
            className="flex items-center justify-center p-2"
            onClick={onSubmit}
          >
            <Check className="h-4 w-4" />
          </DropdownMenuItem>

          {/* QR DOWNLOAD */}
          {member?.qrCode && (
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => downloadQR(member.qrCode!)}
            >
              <QrCode className="h-4 w-4" />
            </DropdownMenuItem>
          )}

          {/* DELETE */}
          {isEditing && member && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center justify-center p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this member?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove “
                    {member.firstName} {member.lastName}”.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>

                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        deleteMember(churchId, member.id, router, toast)
                      }
                    >
                      Delete
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* CHECK-IN CODE DIALOG */}
      {showCheckInCode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Check-In Code</h2>
            <p className="text-3xl font-mono tracking-widest text-center">
              {form.getValues("checkInCode")}
            </p>
            <Button className="mt-4 w-full" onClick={() => setShowCheckInCode(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------
   MAIN MEMBER FORM
------------------------------------------------------- */
export default function MemberForm({
  churchId,
  member,
  onSuccess,
  readOnly = false,
}: {
  churchId: string;
  member?: Member;
  onSuccess?: (id: string) => void;
  readOnly?: boolean;
}) {
  const isEditing = !!member;

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      email: member?.email ?? "",
      phoneNumber: member?.phoneNumber ?? "",
      birthday: member?.birthday ?? "",
      baptismDate: member?.baptismDate ?? "",
      anniversary: member?.anniversary ?? "",
      status: member?.status ?? "Active",
      address: member?.address ?? { street: "", city: "", state: "", zip: "" },
      notes: member?.notes ?? "",
      relationships: member?.relationships ?? [],
      photoFile: null,
      __temp_rel_member: "",
      __temp_rel_type: "",
      checkInCode: member?.checkInCode ?? "",
      qrCode: member?.qrCode ?? "",
      profilePhotoUrl: member?.profilePhotoUrl ?? "",
      tempId: member?.id ?? crypto.randomUUID(),
    },
  });

  const relationships = useMemberRelationships({
    form,
    member,
    isEditMode: isEditing,
  });

  const photo = usePhotoCapture({
    form,
    member,
    churchId,
    isOpen: true,
    initialUrl: member?.profilePhotoUrl ?? null,
  });

  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(values: MemberFormValues) {
    setIsLoading(true);

    try {
      const { photoFile, __temp_rel_member, __temp_rel_type, ...cleanValues } = values;

      if (isEditing) {
        // ⭐ Use your original, correct transactional update
        await updateMember(churchId, member!.id, cleanValues);
        onSuccess?.(member!.id);
      } else {
        // ⭐ Use tempId if it exists
        const tempId = form.getValues("tempId");
        const newId = tempId ?? crypto.randomUUID();

        // Generate check-in code if missing
        const checkInCode = cleanValues.checkInCode || generateCheckInCode();

        // ⭐ Create member using your original addMember logic
        await addMember(churchId, {
          id: newId,
          ...cleanValues,
          checkInCode,
        });

        // ⭐ Generate QR code
        const qrValue = `${window.location.origin}/check-in/${churchId}?code=${checkInCode}`;
        const qrBase64 = await QRCode.toDataURL(qrValue);
        const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");
        const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const qrBlob = new Blob([byteArray], { type: "image/png" });
        const qrFile = new File([qrBlob], "qr.png", { type: "image/png" });

        // Upload QR code through server API (avoids client storage RLS failures).
        const formData = new FormData();
        formData.append("file", qrFile);
        formData.append("churchId", churchId);
        formData.append("memberId", newId);
        formData.append("kind", "qr");

        try {
          const uploadRes = await fetch("/api/members/media/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (uploadRes.ok) {
            const body = await uploadRes.json();
            if (typeof body?.url === "string" && body.url.length > 0) {
              await updateMember(churchId, newId, { qrCode: body.url });
            }
          } else {
            const body = await uploadRes.json().catch(() => ({}));
            console.error("QR upload failed:", body?.error ?? uploadRes.statusText);
          }
        } catch (uploadErr) {
          console.error("QR upload error:", uploadErr);
        }

        onSuccess?.(newId);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Member save failed:", message);
      toast({ title: "Error", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <fieldset disabled={readOnly} className="space-y-6">
        <form
          id="member-form"
          onSubmit={readOnly ? (e) => e.preventDefault() : form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <MemberInfoSection form={form} />
          <StatusSection form={form} />
          <RelationshipsSection
            form={form}
            currentMemberId={member?.id ?? form.getValues("tempId") ?? ""}
            allMembers={relationships.allMembers}
            availableMembers={relationships.availableMembers}
            relationshipOptions={relationships.relationshipOptions}
            fields={relationships.fields}
            append={relationships.append}
            remove={relationships.remove}
          />
          <PhotoSection
            churchId={churchId}
            form={form}
            previewUrl={photo.previewUrl}
            fileInputRef={photo.fileInputRef}
            setIsTakingPhoto={photo.setIsTakingPhoto}
            handleRemovePhoto={photo.handleRemovePhoto}
          />

          {isEditing && (
            <CheckInCodeSection member={member} churchId={churchId} />
          )}
        </form>

        {/* ⭐ FAB MENU OUTSIDE THE FORM ⭐ */}
        <MemberFabMenu
          isEditing={isEditing}
          member={member}
          churchId={churchId}
          form={form}
          isLoading={isLoading}
          onSubmit={() => {
            const formEl = document.getElementById("member-form") as HTMLFormElement;
            formEl?.requestSubmit();
          }}
        />
      </fieldset>
    </Form>
  );
}
