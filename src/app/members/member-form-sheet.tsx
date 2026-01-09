'use client';

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import type { Member } from "@/lib/types";
import { useChurchId } from "@/hooks/useChurchId";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

import { addMember, updateMember } from "@/lib/members";

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  birthday: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["Active", "Prospect", "Archived"]),
  imageHint: z.string().optional().or(z.literal("")),
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

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthday: "",
      status: "Prospect",
      notes: "",
      imageHint: "",
      photoFile: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && member) {
        form.reset({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          birthday: member.birthday
            ? new Date(member.birthday).toISOString().split("T")[0]
            : "",
          status: member.status,
          notes: member.notes ?? "",
          imageHint: member.imageHint ?? "",
          photoFile: null,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          birthday: "",
          status: "Prospect",
          notes: "",
          imageHint: "",
          photoFile: null,
        });
      }
    }
  }, [isOpen, isEditMode, member, form]);

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
      let photoUrl = member?.photoUrl ?? "";

      if (data.photoFile) {
        const storageId = isEditMode && member ? member.id : crypto.randomUUID();

        const fileRef = ref(
          storage,
          `churches/${churchId}/members/${storageId}.jpg`
        );

        await uploadBytes(fileRef, data.photoFile);
        photoUrl = await getDownloadURL(fileRef);
      }

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday ? new Date(data.birthday) : null,
        notes: data.notes,
        status: data.status,
        imageHint: data.imageHint,
        photoUrl,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Member" : "Add Member"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* FIRST NAME */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* LAST NAME */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
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

            {/* PHONE */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* BIRTHDAY */}
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

            {/* STATUS */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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

            {/* NOTES */}
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

            {/* IMAGE HINT */}
            <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Hint</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PHOTO UPLOAD */}
            <FormField
              control={form.control}
              name="photoFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        field.onChange(e.target.files?.[0] ?? null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">
                {isEditMode ? "Save Changes" : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}