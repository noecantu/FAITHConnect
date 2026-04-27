"use client";

import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/app/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Camera, Trash } from "lucide-react";
import ImageDropzone from "@/app/components/settings/ImageDropzone";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import { useToast } from "@/app/hooks/use-toast";

type Props = {
  churchId: string;
  form: UseFormReturn<MemberFormValues>;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsTakingPhoto: (open: boolean) => void;
  handleRemovePhoto: () => void;
};

export function PhotoSection({
  churchId,
  form,
  previewUrl,
  fileInputRef,
  setIsTakingPhoto,
  handleRemovePhoto,
}: Props) {
  const { toast } = useToast();
  const memberId = form.watch("tempId");

  const uploadMemberPhotoViaApi = async (file: File) => {
    const resolvedMemberId = memberId ?? form.getValues("tempId");

    if (!resolvedMemberId) {
      throw new Error("Missing member ID for photo upload.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("churchId", churchId);
    formData.append("memberId", resolvedMemberId);
    formData.append("kind", "profile");

    const uploadRes = await fetch("/api/members/media/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!uploadRes.ok) {
      const body = await uploadRes.json().catch(() => ({}));
      throw new Error(body?.error ?? `Upload failed (${uploadRes.status})`);
    }

    const body = await uploadRes.json();
    if (typeof body?.url !== "string" || body.url.length === 0) {
      throw new Error("Upload failed: missing image URL.");
    }

    return body.url;
  };

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Photo</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Preview */}
        <div className="w-full aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Member photo preview"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 90vw, 384px"
            />
          ) : (
            <span className="text-sm text-muted-foreground">No Photo</span>
          )}
        </div>

        {/* Drag-and-drop uploader */}
        <ImageDropzone
          label="Upload Photo"
          path={`churches/${churchId}/members/${memberId}/profile.jpg`}
          uploadHandler={uploadMemberPhotoViaApi}
          onUploaded={(url) => {
            form.setValue("profilePhotoUrl", url);
            form.setValue("photoFile", null);
          }}
          onError={(error) => {
            toast({
              title: "Upload failed",
              description: error.message || "Could not upload member photo.",
            });
          }}
        />

        {/* Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTakingPhoto(true)}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleRemovePhoto}
          >
            <Trash className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>

        {/* Hidden file input (still needed for camera capture fallback) */}
        <FormField
          control={form.control}
          name="photoFile"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    field.onChange(f);
                    if (f) {
                      form.setValue("profilePhotoUrl", URL.createObjectURL(f));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
