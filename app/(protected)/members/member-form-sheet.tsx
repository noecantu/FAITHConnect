'use client';

import { useState, useRef } from "react";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Camera } from "lucide-react";

import type { Member } from "../../lib/types";

import { useMemberForm } from "../../hooks/useMemberForm";
import { useMemberRelationships } from "../../hooks/useMemberRelationships";
import { usePhotoCapture } from "../../hooks/usePhotoCapture";
import { MemberForm } from "./components/MemberForm";
import { useChurchId } from "../../hooks/useChurchId";

interface MemberFormSheetProps {
  member?: Member;
  children?: ReactNode;
}

export function MemberFormSheet({ member, children }: MemberFormSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const churchId = useChurchId();

  const { form, isEditMode, onSubmit, handleDeleteMember } = useMemberForm(
    member,
    { isOpen, setIsOpen }
  );

  const relationships = useMemberRelationships(form, member, isEditMode);

  const {
    previewUrl,
    isTakingPhoto,
    setIsTakingPhoto,
    hasCameraPermission,
    videoRef,
    canvasRef,
    fileInputRef,
    handleCapturePhoto,
  } = usePhotoCapture(form, member, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="focus:outline-none"
          >
            {isEditMode ? "Edit Member" : "Add Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the member's details"
              : "Add a new member to the directory"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          <MemberForm
            form={form}
            onSubmit={onSubmit}
            relationships={{
              fields: relationships.fields,
              append: relationships.append,
              remove: relationships.remove,
              allMembers: relationships.allMembers,
              availableMembers: relationships.availableMembers,
              relationshipOptions: relationships.relationshipOptions,
            }}
            photo={{
              previewUrl,
              fileInputRef,
              setIsTakingPhoto,
            }}
            churchId={churchId}
            member={member}
          />
        </div>

        <DialogFooter className="border-t px-6 pb-6 pt-4 flex justify-end gap-2">

          {isEditMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescriptionComponent>
                    This action cannot be undone. This will permanently delete the member profile for{" "}
                    {member?.firstName} {member?.lastName}.
                  </AlertDialogDescriptionComponent>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteMember}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button type="submit" form="member-form">
            {isEditMode ? "Save" : "Add Member"}
          </Button>

        </DialogFooter>

      </DialogContent>

      {/* CAMERA DIALOG */}
      <Dialog open={isTakingPhoto} onOpenChange={setIsTakingPhoto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
            <DialogDescription>
              Use your device&apos;s camera to take a new photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="w-full aspect-video"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {!hasCameraPermission && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              onClick={handleCapturePhoto}
              disabled={!hasCameraPermission}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
