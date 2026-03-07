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
    <Card>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto">Upload</Button>
          <Button className="w-full sm:w-auto">Take Photo</Button>
          <Button variant="destructive" className="w-full sm:w-auto">Remove</Button>
        </div>
        <FormField
          control={form.control}
          name="photoFile"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input
                  type="file"
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
