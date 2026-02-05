'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "./use-toast";
import { useChurchId } from "./useChurchId";
import type { Member } from "../lib/types";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { addMember, updateMember, deleteMember } from "../lib/members";

import { memberSchema, type MemberFormValues } from "../lib/memberForm.schema";

type UseMemberFormOptions = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function useMemberForm(member: Member | undefined, opts: UseMemberFormOptions) {
  const { isOpen, setIsOpen } = opts;
  const { toast } = useToast();
  const churchId = useChurchId();
  const isEditMode = !!member;

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

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && member) {
      const memberRelationships =
        member.relationships?.map((r) => ({
          relatedMemberId: r.memberIds.find((id) => id !== member.id) || "",
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
  }, [isOpen, isEditMode, member, form.reset]);

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

  const onSubmit = async (data: MemberFormValues) => {
    if (!churchId) {
      toast({
        title: "Error",
        description: "Church ID is missing.",
        variant: "destructive",
      });
      return;
    }

    const currentMemberId =
      isEditMode && member ? member.id : crypto.randomUUID();

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
        relationships: data.relationships?.map((r) => ({
          memberIds: [currentMemberId, r.relatedMemberId],
          type: r.type,
        })),
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
  };

  return {
    form,
    isEditMode,
    onSubmit,
    handleDeleteMember,
  };
}
