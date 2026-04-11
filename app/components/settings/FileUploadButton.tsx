"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/app/lib/firebase/client";

interface Props {
  label: string;
  path: string; // e.g. "branding/logo.png"
  onUploaded: (url: string) => void;
}

export default function FileUploadButton({ label, path, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);
      onUploaded(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button asChild disabled={uploading}>
        <label className="cursor-pointer">
          {uploading ? "Uploading..." : label}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </Button>
    </div>
  );
}
