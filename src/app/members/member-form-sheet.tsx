
'use client';

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, type ReactNode, useRef } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/hooks/use-toast";
import type { Member } from "@/lib/types";
import { useChurchId } from "@/hooks/useChurchId";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

import { addMember, updateMember } from "@/lib/members";
import { Camera, Upload } from "lucide-react";

const memberSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().min(1, "Phone is required"),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(["current", "archived"]),
  photoFile: z
    .any()
    .optional()
    .transform((file) => (file instanceof File ? file : null)),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormSheetProps {
  member?: Member;
  children?: ReactNode;
}

export function MemberFormSheet({ member, children }: MemberFormSheetProps) {
  const { toast } = useToast();
  const churchId = useChurchId();
  const isEditMode = !!member;

  const [isOpen, setIsOpen] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      birthday: "",
      anniversary: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
      status: "current",
      notes: "",
      photoFile: null,
    },
  });

  const photoFile = form.watch("photoFile");

  useEffect(() => {
    if (photoFile) {
      setPreviewUrl(URL.createObjectURL(photoFile));
    } else if (member?.profilePhotoUrl) {
      setPreviewUrl(member.profilePhotoUrl);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [photoFile, member, isOpen]);


  useEffect(() => {
    if (isOpen) {
      if (isEditMode && member) {
        form.reset({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          birthday: member.birthday
            ? new Date(member.birthday).toISOString().split("T")[0]
            : "",
          anniversary: member.anniversary
            ? new Date(member.anniversary).toISOString().split("T")[0]
            : "",
          address: {
            street: member.address?.street ?? "",
            city: member.address?.city ?? "",
            state: member.address?.state ?? "",
            zip: member.address?.zip ?? "",
          },
          status: member.status,
          notes: member.notes ?? "",
          photoFile: null,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          birthday: "",
          anniversary: "",
          address: {
            street: "",
            city: "",
            state: "",
            zip: "",
          },
          status: "current",
          notes: "",
          photoFile: null,
        });
      }
    }
  }, [isOpen, isEditMode, member, form]);

  useEffect(() => {
    if(isTakingPhoto) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({video: true});
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
          setIsTakingPhoto(false);
        }
      };

      getCameraPermission();

      return () => {
        if(videoRef.current && videoRef.current.srcObject){
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isTakingPhoto, toast]);

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            form.setValue('photoFile', file);
            setIsTakingPhoto(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  async function onSubmit(data: MemberFormValues) {
    if (!churchId) {
      toast({
        title: "Error",
        description: "Church ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      let profilePhotoUrl = member?.profilePhotoUrl ?? "";

      if (data.photoFile) {
        const storageId = isEditMode && member ? member.id : crypto.randomUUID();

        const fileRef = ref(
          storage,
          `churches/${churchId}/members/${storageId}.jpg`
        );

        await uploadBytes(fileRef, data.photoFile);
        profilePhotoUrl = await getDownloadURL(fileRef);
      }

      const payload: Partial<Member> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        birthday: data.birthday,
        anniversary: data.anniversary,
        address: data.address,
        notes: data.notes,
        status: data.status,
        profilePhotoUrl,
      };

      if (isEditMode && member) {
        await updateMember(churchId, member.id, payload);
        toast({
          title: "Member Updated",
          description: `${data.firstName} ${data.lastName} has been updated.`,
        });
      } else {
        await addMember(churchId, payload);
        toast({
          title: "Member Added",
          description: `${data.firstName} ${data.lastName} has been created.`,
        });
      }

      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while saving the member.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Member" : "Add Member"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 pl-2 -ml-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anniversary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anniversary</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main St" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="current">Current</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relationships</CardTitle>
                <CardDescription>Manage member relationships.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                  Relationship management UI coming soon.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-40 h-40 mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                   {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Member photo preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">No Photo</span>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>
                    Upload
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsTakingPhoto(true)}>
                    <Camera className="mr-2 h-4 w-4"/>
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
          </form>
        </Form>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {isEditMode ? "Save Changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isTakingPhoto} onOpenChange={setIsTakingPhoto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
             <div className="bg-muted rounded-md overflow-hidden">
                <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
             </div>
             {!hasCameraPermission && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature.
                  </AlertDescription>
                </Alert>
             )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCapturePhoto} disabled={!hasCameraPermission}>
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
