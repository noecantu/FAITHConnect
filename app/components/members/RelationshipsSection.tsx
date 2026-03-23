"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import {
  FormItem,
  FormLabel,
  FormControl,
} from "@/app/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import type { Member } from "@/app/lib/types";

type Props = {
  form: UseFormReturn<MemberFormValues>;
  fields: FieldArrayWithId<MemberFormValues, "relationships", "id">[];
  append: (value: {
    memberIds: [string, string];
    type: string;
  }) => void;
  remove: (index: number) => void;
  allMembers: Member[];
  availableMembers: Member[];
  relationshipOptions: string[];
  currentMemberId: string;
};

export function RelationshipsSection({
  form,
  fields,
  append,
  remove,
  allMembers,
  availableMembers,
  relationshipOptions,
  currentMemberId,
}: Props) {
  const { toast } = useToast();

  const tempMember = form.watch("__temp_rel_member");
  const tempType = form.watch("__temp_rel_type");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Relationships</CardTitle>
        <CardDescription>Manage member relationships.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field, index) => {
              const [id1, id2] = field.memberIds;
              const relatedId = id1 === currentMemberId ? id2 : id1;

              const relatedMember = allMembers.find((m) => m.id === relatedId);

              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-2 p-3 border rounded-md bg-muted/50"
                >
                  <div className="flex-grow text-sm">
                    <span className="font-semibold">{field.type}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      of{" "}
                      {relatedMember
                        ? `${relatedMember.lastName}, ${relatedMember.firstName}`
                        : "Unknown Member"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
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
              <Select
                value={tempMember}
                onValueChange={(val) => form.setValue("__temp_rel_member", val)}
              >
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
              <Select
                value={tempType}
                onValueChange={(val) => form.setValue("__temp_rel_type", val)}
              >
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
              if (!currentMemberId) {
                toast({ title: "Cannot add a relationship until this member has an ID." });
                return;
              }

              if (tempMember && tempType) {
                append({
                  memberIds: [currentMemberId, tempMember],
                  type: tempType,
                });

                form.setValue("__temp_rel_member", "");
                form.setValue("__temp_rel_type", "");
              } else {
                toast({
                  title: "Please select a member and relationship type.",
                });
              }
            }}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
