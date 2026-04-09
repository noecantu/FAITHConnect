"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/app/lib/firebase/client";
import { cn } from "@/app/lib/utils";

interface Props {
  label: string;
  path: string; // e.g. "branding/logo.png"
  onUploaded: (url: string) => void;
}

export default function ImageDropzone({ label, path, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);

      try {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        onUploaded(url);
      } finally {
        setUploading(false);
        setDragActive(false);
      }
    },
    [path, onUploaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="space-y-1">
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
