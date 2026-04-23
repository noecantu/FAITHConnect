"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app, storage } from "@/app/lib/firebase/client";
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

  const getCandidateBuckets = () => {
    const configured = storage.app.options.storageBucket;
    if (!configured) return [];

    const normalized = configured.replace(/^gs:\/\//, "");
    const candidates: string[] = [];

    if (normalized.endsWith(".appspot.com")) {
      candidates.push(normalized.replace(".appspot.com", ".firebasestorage.app"));
    }

    candidates.push(normalized);

    if (normalized.endsWith(".firebasestorage.app")) {
      candidates.push(normalized.replace(".firebasestorage.app", ".appspot.com"));
    }

    return Array.from(new Set(candidates));
  };

  const uploadWithTimeout = async (bucket: string, file: File) => {
    const bucketStorage = getStorage(app, `gs://${bucket}`);
    const storageRef = ref(bucketStorage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const url = await new Promise<string>((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        uploadTask.cancel();
        reject(new Error(`Upload timed out for bucket ${bucket}.`));
      }, 120000);

      uploadTask.on(
        "state_changed",
        undefined,
        (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        },
        async () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);

          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (error) {
            reject(error);
          }
        }
      );
    });

    return url;
  };

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

        const buckets = getCandidateBuckets();

        if (buckets.length === 0) {
          throw new Error("No Firebase Storage bucket is configured.");
        }

        let lastError: unknown = null;

        for (const bucket of buckets) {
          try {
            const url = await uploadWithTimeout(bucket, file);
            onUploaded(url);
            return;
          } catch (error) {
            lastError = error;
            console.error(`Image upload failed for bucket ${bucket}:`, error);
          }
        }

        if (lastError instanceof Error) {
          throw lastError;
        }

        throw new Error("Upload failed. Please verify Firebase Storage configuration.");
      } catch (error) {
        const normalized =
          error instanceof Error ? error : new Error("Upload failed.");
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
