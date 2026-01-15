'use client';

import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useToast } from "@/hooks/use-toast";
import type { Member } from "@/lib/types";
import type { MemberFormValues } from "../lib/memberForm.schema";

export function usePhotoCapture(
  form: UseFormReturn<MemberFormValues>,
  member: Member | undefined,
  isOpen: boolean
) {
  const { toast } = useToast();

  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoFile = form.watch("photoFile");

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPreviewUrl(url);
      return () => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      };
    } else if (member?.profilePhotoUrl) {
      setPreviewUrl(member.profilePhotoUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [photoFile, member, isOpen]);

  useEffect(() => {
    if (!isTakingPhoto) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this app.",
        });
        setIsTakingPhoto(false);
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
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

  return {
    previewUrl,
    isTakingPhoto,
    setIsTakingPhoto,
    hasCameraPermission,
    videoRef,
    canvasRef,
    fileInputRef,
    handleCapturePhoto,
  };
}
