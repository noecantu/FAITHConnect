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

import { db, storage } from "@/app/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import type { Member } from "@/app/lib/types";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import { memberSchema } from "@/app/lib/memberForm.schema";

import { useMemberRelationships } from "@/app/hooks/useMemberRelationships";
import { usePhotoCapture } from "@/app/hooks/usePhotoCapture";

import QRCode from "qrcode";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

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

export interface StandaloneMemberFormProps {
  churchId: string;
  member?: Member;
  onSuccess?: (id: string) => void;
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
  onSubmit,
}: {
  isEditing: boolean;
  member?: Member;
  churchId: string;
  form: any;
  isLoading: boolean;
  onSubmit: () => void;
}) {
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
          className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1"
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

          {/* VIEW CHECK-IN CODE */}
          {isEditing && (
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => setShowCheckInCode(true)}
            >
              <FileUser className="h-4 w-4" />
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

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
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

function generateCheckInCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* -------------------------------------------------------
   MAIN MEMBER FORM
------------------------------------------------------- */
export default function MemberForm({
  churchId,
  member,
  onSuccess,
}: StandaloneMemberFormProps) {
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
      if (isEditing) {
        const { photoFile, __temp_rel_member, __temp_rel_type, ...cleanValues } = values;

        await updateDoc(
          doc(db, "churches", churchId, "members", member!.id),
          { ...cleanValues, updatedAt: serverTimestamp() }
        );

        onSuccess?.(member!.id);
      } else {
        const newId = crypto.randomUUID();
        const { photoFile, __temp_rel_member, __temp_rel_type, ...cleanValues } = values;

        // Generate a check-in code if missing
        const checkInCode = cleanValues.checkInCode || generateCheckInCode();

        // 1. Create the member document first (with check-in code)
        await setDoc(
          doc(db, "churches", churchId, "members", newId),
          {
            id: newId,
            churchId,
            ...cleanValues,
            checkInCode, // <-- ensure it is saved
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        // 2. Generate QR code using the correct check-in code
        const qrValue = `${window.location.origin}/check-in/${churchId}?code=${checkInCode}`;
        const qrBase64 = await QRCode.toDataURL(qrValue);
        const safeFirst = cleanValues.firstName.replace(/\s+/g, "");
        const safeLast = cleanValues.lastName.replace(/\s+/g, "");
        const fileName = `QRCode_${safeFirst}${safeLast}.png`;

        // 3. Upload QR code to Firebase Storage
        const qrRef = ref(
          storage,
          `churches/${churchId}/members/${newId}/${fileName}`
        );
        await uploadString(qrRef, qrBase64, "data_url");
        const qrUrl = await getDownloadURL(qrRef);

        // 4. Save QR code URL to Firestore
        await updateDoc(
          doc(db, "churches", churchId, "members", newId),
          { qrCode: qrUrl }
        );

        onSuccess?.(newId);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save member." });
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

        <RelationshipsSection
          allMembers={[]}
          currentMemberId={""}
          form={form}
          {...relationships}
        />

        <PhotoSection
          form={form}
          previewUrl={photo.previewUrl}
          fileInputRef={photo.fileInputRef}
          setIsTakingPhoto={photo.setIsTakingPhoto}
          handleRemovePhoto={photo.handleRemovePhoto}
        />
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
    </Form>
  );
}
