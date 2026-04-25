"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { cn } from "@/app/lib/utils";

interface Props {
  label: string;
  path: string; // e.g. "branding/logo.png"
  onUploaded: (url: string) => void;
  onError?: (error: Error) => void;
  uploadHandler?: (file: File) => Promise<string>;
}

export default function ImageDropzone({
  label,
  path,
  onUploaded,
  onError,
  uploadHandler,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);

      try {
        if (uploadHandler) {
          const url = await uploadHandler(file);
          onUploaded(url);
          return;
        }

        // Default: upload to Supabase Storage (logos bucket)
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.storage
          .from("logos")
          .upload(path, file, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(data.path);
        onUploaded(publicUrl);
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error("Upload failed.");
        console.error("Image upload failed:", normalized);
        onError?.(normalized);
      } finally {
        setUploading(false);
        setDragActive(false);
      }
    },
    [path, onUploaded, onError, uploadHandler]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dragActive
              ? "Drop image here…"
              : `${label} — Click or drag an image`}
          </p>
        )}
      </div>
    </div>
  );
}
