'use client';

import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Camera, Trash, Upload } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";

type Props = {
  form: UseFormReturn<MemberFormValues>;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsTakingPhoto: (open: boolean) => void;
  handleRemovePhoto: () => void;
};

export function PhotoSection({
  form,
  previewUrl,
  fileInputRef,
  setIsTakingPhoto,
  handleRemovePhoto,
}: Props) {
  return (
    <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Photo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
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
        <FormField
          control={form.control}
          name="photoFile"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input
                  type="file"
                  className="w-full sm:w-auto"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) =>
                    field.onChange(e.target.files?.[0] ?? null)
                  }
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
