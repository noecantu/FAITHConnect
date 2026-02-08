'use client';

import Image from "next/image";
import { Button } from "../../components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Camera, Upload } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../../lib/memberForm.schema";

type Props = {
  form: UseFormReturn<MemberFormValues>;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsTakingPhoto: (open: boolean) => void;
};

export function PhotoSection({
  form,
  previewUrl,
  fileInputRef,
  setIsTakingPhoto,
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
        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
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
