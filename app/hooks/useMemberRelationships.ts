"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { listenToMembers } from "../lib/members";
import type { Member } from "../lib/types";
import { useChurchId } from "./useChurchId";
import type { MemberFormValues } from "../lib/memberForm.schema";

export function useMemberRelationships({
  form,
  member,
  isEditMode,
}: {
  form: UseFormReturn<MemberFormValues>;
  member: Member | undefined;
  isEditMode: boolean;
}) {
  const { churchId } = useChurchId();
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!churchId) {
      setAllMembers([]);
      return;
    }

    const unsubscribe = listenToMembers(churchId, (loaded) => {
      setAllMembers(loaded);
    });

    return () => unsubscribe?.();
  }, [churchId]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relationships",
  });

  const relationshipOptions = [
    "Spouse",
    "Parent",
    "Child",
    "Sibling",
    "Guardian",
    "Ward",
  ];

  const availableMembers = useMemo(() => {
    return allMembers
      .filter((m) => !isEditMode || m.id !== member?.id)
      .sort((a, b) => {
        const nameA = `${a.lastName || ""}, ${a.firstName || ""}`.toLowerCase();
        const nameB = `${b.lastName || ""}, ${b.firstName || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [allMembers, isEditMode, member]);

  return {
    fields,
    append,
    remove,
    relationshipOptions,
    availableMembers,
  };
}
