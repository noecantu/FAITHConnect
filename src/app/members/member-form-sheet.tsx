
'use client';

import * as z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, type ReactNode, useRef, useMemo } from "react";
import Image from "next/image";

import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/hooks/use-toast";
import type { Member } from "@/lib/types";
import { useChurchId } from "@/hooks/useChurchId";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

import { addMember, updateMember, listenToMembers, deleteMember } from "@/lib/members";
import { Camera, Upload, Trash2 } from "lucide-react";

const relationshipSchema = z.object({
  relatedMemberId: z.string().min(1, "Member is required"),
  type: z.string().min(1, "Relationship type is required"),
});

const memberSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().min(1, "Phone is required"),
  birthday: z.string().optional(),
  baptismDate: z.string().optional(),
  anniversary: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Archived"]),
  relationships: z.array(relationshipSchema).optional(),
  photoFile: z
    .any()
    .optional()
    .transform((file) => (file instanceof File ? file : null)),
});

interface MemberFormSheetProps {
  member?: Member;
  children?: ReactNode;
}

export type MemberFormValues = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  birthday?: string;
  baptismDate?: string;
  anniversary?: string;
  status: "Active" | "Prospect" | "Archived";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  notes?: string;
  photoFile: File | null;
  relationships?: {
    relatedMemberId: string;
    type: string;
    anniversary?: string;
  }[];
};

export function MemberFormSheet({ member, children }: MemberFormSheetProps) {
  const { toast } = useToast();
  const churchId = useChurchId();
  const isEditMode = !!member;

  const [isOpen, setIsOpen] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      birthday: "",
      baptismDate: "",
      anniversary: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
      status: "Active",
      notes: "",
      relationships: [],
      photoFile: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relationships",
  });

  const photoFile = form.watch("photoFile");

  useEffect(() => {
    if (!churchId) return;
    const unsubscribe = listenToMembers(churchId, (members) => {
      setAllMembers(members);
    });
    return () => unsubscribe();
  }, [churchId]);


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
        const memberRelationships = member.relationships?.map(r => ({
            relatedMemberId: r.memberIds.find(id => id !== member.id) || '',
            type: r.type,
        })) || [];
        form.reset({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          birthday: member.birthday
            ? new Date(member.birthday).toISOString().split("T")[0]
            : "",
          baptismDate: member.baptismDate
            ? new Date(member.baptismDate).toISOString().split("T")[0]
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
          relationships: memberRelationships,
          photoFile: null,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          birthday: "",
          baptismDate: "",
          anniversary: "",
          address: {
            street: "",
            city: "",
            state: "",
            zip: "",
          },
          status: "Active",
          notes: "",
          relationships: [],
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

  const handleDeleteMember = async () => {
    if (!isEditMode || !member || !churchId) {
      toast({
        title: "Error",
        description: "Cannot delete member.",
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteMember(churchId, member.id);
      toast({
        title: "Member Deleted",
        description: `${member.firstName} ${member.lastName} has been removed.`,
      });
      setIsDeleteDialogOpen(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete the member.",
        variant: "destructive",
      });
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

    const currentMemberId = isEditMode && member ? member.id : crypto.randomUUID();

    try {
      let profilePhotoUrl = member?.profilePhotoUrl ?? "";

      if (data.photoFile) {
        try {
            const fileRef = ref(
              storage,
              `churches/${churchId}/members/${currentMemberId}.jpg`
            );
    
            await uploadBytes(fileRef, data.photoFile);
            profilePhotoUrl = await getDownloadURL(fileRef);
        } catch (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast({
                title: "Upload Error",
                description: "Failed to upload photo. Please try again.",
                variant: "destructive",
            });
            return;
        }
      }

      const payload: Partial<Member> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        birthday: data.birthday,
        baptismDate: data.baptismDate,
        anniversary: data.anniversary,
        address: data.address,
        notes: data.notes,
        status: data.status,
        profilePhotoUrl,
        relationships: data.relationships?.map(r => ({
            memberIds: [currentMemberId, r.relatedMemberId],
            type: r.type,
        }))
      };

      if (isEditMode && member) {
        await updateMember(churchId, member.id, payload);
        toast({
          title: "Member Updated",
          description: `${data.firstName} ${data.lastName} has been updated.`,
        });
      } else {
        const newMemberPayload = { ...payload, id: currentMemberId };
        await addMember(churchId, newMemberPayload);
        toast({
          title: "Member Added",
          description: `${data.firstName} ${data.lastName} has been created.`,
        });
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast({
        title: "Error",
        description: "Something went wrong while saving the member.",
        variant: "destructive",
      });
    } finally {
      setIsOpen(false);
    }
  }

  const relationshipOptions = [
    "Spouse", "Parent", "Child", "Sibling", "Guardian", "Ward"
  ];
  
  const availableMembers = useMemo(() => {
    return allMembers
      .filter(m => !isEditMode || m.id !== member?.id)
      .sort((a, b) => {
         const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
         const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
         return nameA.localeCompare(nameB);
      });
  }, [allMembers, isEditMode, member]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent 
        className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0" 
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle ref={titleRef} tabIndex={-1} className="focus:outline-none">
            {isEditMode ? "Edit Member" : "Add Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the member's details" : "Add a new member to the directory"}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          <Form {...form}>
            <form
              id="member-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pl-6 pr-4 py-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Member Information</CardTitle>
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
                    name="baptismDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baptism Date</FormLabel>
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
                  <CardTitle className="text-xl">Status</CardTitle>
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
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Prospect">Prospect</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
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
                  <CardTitle className="text-xl">Relationships</CardTitle>
                  <CardDescription>Manage member relationships.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.length > 0 && (
                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const relatedMember = allMembers.find(m => m.id === field.relatedMemberId);
                        return (
                          <div key={field.id} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-muted/50">
                              <div className="flex-grow text-sm">
                                <span className="font-semibold">{field.type}</span>
                                <span className="text-muted-foreground"> of {relatedMember ? `${relatedMember.lastName}, ${relatedMember.firstName}` : 'Unknown Member'}</span>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2">
                      <div className="grid grid-cols-2 gap-4 flex-grow">
                        <FormItem>
                            <FormLabel>Member</FormLabel>
                            <Select onValueChange={(val) => form.setValue(`__temp_rel_member` as any, val)}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Member" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.lastName}, {m.firstName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                        <FormItem>
                            <FormLabel>Relationship</FormLabel>
                              <Select onValueChange={(val) => form.setValue(`__temp_rel_type` as any, val)}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {relationshipOptions.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                      </div>
                      <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                              const newRel = form.getValues(['__temp_rel_member', '__temp_rel_type'] as any);
                              if (newRel && newRel[0] && newRel[1]) {
                                  append({ relatedMemberId: newRel[0], type: newRel[1] });
                                  // Consider resetting the temp fields here if needed
                              } else {
                                  toast({ title: "Please select a member and relationship type.", variant: "destructive" });
                              }
                          }}
                      >
                          Add
                      </Button>
                  </div>
                  
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
                </CardContent>
              </Card>

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

        <DialogFooter className="flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:items-center">
          {isEditMode ? (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </Button>

                <Button type="submit" form="member-form">
                  Save
                </Button>
            </>
          ) : (
            <div className="flex w-full justify-end sm:justify-start">
              <Button type="submit" form="member-form">
                Add Member
              </Button>
            </div>
          )}
        </DialogFooter>

      </DialogContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescriptionComponent>
              This action cannot be undone. This will permanently delete the member profile for {member?.firstName} {member?.lastName}.
            </AlertDialogDescriptionComponent>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isTakingPhoto} onOpenChange={setIsTakingPhoto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
            <DialogDescription>
                Use your device's camera to take a new photo.
            </DialogDescription>
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
