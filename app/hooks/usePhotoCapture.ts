'use client';

import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useToast } from "./use-toast";
import type { Member } from "../lib/types";
import type { MemberFormValues } from "../lib/memberForm.schema";
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import { storage } from '@/app/lib/firebase/client';

export function usePhotoCapture({
  form,
  member,
  churchId,
  isOpen,
  initialUrl,
}: {
  form: UseFormReturn<MemberFormValues>;
  member: Member | undefined;
  churchId: string;
  isOpen: boolean;
  initialUrl: string | null;
}) {
  const { toast } = useToast();

  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoFile = form.watch("photoFile");
  const profilePhotoUrl = form.watch("profilePhotoUrl");

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPreviewUrl(url);
      return () => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      };
      } else if (profilePhotoUrl) {
      setPreviewUrl(profilePhotoUrl);
    } else if (initialUrl) {
      setPreviewUrl(initialUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [photoFile, profilePhotoUrl, member, isOpen, initialUrl]);

  useEffect(() => {
    async function uploadPhoto() {
      if (!photoFile) return;

      // 1. Determine the correct ID to use
      let id = member?.id;

      // 2. If no member ID yet, use or create a tempId
      if (!id) {
        id = form.getValues("tempId");

        if (!id) {
          id = crypto.randomUUID();
          form.setValue("tempId", id, { shouldDirty: true });
        }
      }

      try {
        // 3. Upload using the stable ID (real or temp)
        const storageRef = ref(
          storage,
          `churches/${churchId}/members/${id}/profile.jpg`
        );

        await uploadBytes(storageRef, photoFile);
        const url = await getDownloadURL(storageRef);

        // 4. Save the URL to the form
        form.setValue("profilePhotoUrl", url, { shouldDirty: true });
      } catch (err) {
        console.error("Photo upload failed:", err);
        toast({
          title: "Upload Failed",
          description: "Could not upload the photo. Please try again.",
        });
      }
    }

    uploadPhoto();
  }, [photoFile, member?.id]);

  useEffect(() => {
    if (!isTakingPhoto) return;

    const videoEl = videoRef.current; // capture ref ONCE

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoEl) {
          videoEl.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          // variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this app.",
        });
        setIsTakingPhoto(false);
      }
    };

    getCameraPermission();

    return () => {
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isTakingPhoto, toast]);

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "capture.jpg", {
                type: "image/jpeg",
              });
              form.setValue("photoFile", file);
              setIsTakingPhoto(false);
            }
          },
          "image/jpeg"
        );
      }
    }
  };

  const handleRemovePhoto = async () => {
    const url = form.getValues("profilePhotoUrl");

    if (url) {
      try {
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      } catch (err) {
        console.error("Failed to delete photo:", err);
      }
    }

    form.setValue("photoFile", null, { shouldDirty: true });
    form.setValue("profilePhotoUrl", "", { shouldDirty: true });
    setPreviewUrl(null);
  };

  return {
    previewUrl,
    isTakingPhoto,
    setIsTakingPhoto,
    hasCameraPermission,
    videoRef,
    canvasRef,
    fileInputRef,
    handleCapturePhoto,
    handleRemovePhoto,
  };
}
