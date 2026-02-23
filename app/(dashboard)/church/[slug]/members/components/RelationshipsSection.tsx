'use client';

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
  FormField,
  FormMessage,
} from "@/app/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import type { MemberFormValues } from "@/app/lib/memberForm.schema";
import type { Member } from "@/app/lib/types";

type Props = {
  form: UseFormReturn<MemberFormValues>;
  fields: FieldArrayWithId<MemberFormValues, "relationships", "id">[];
  append: (value: { relatedMemberId: string; type: string }) => void;
  remove: (index: number) => void;
  allMembers: Member[];
  availableMembers: Member[];
  relationshipOptions: string[];
};

export function RelationshipsSection({
  form,
  fields,
  append,
  remove,
  allMembers,
  availableMembers,
  relationshipOptions,
}: Props) {
  const { toast } = useToast();

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
              const relatedMember = allMembers.find(
                (m) => m.id === field.relatedMemberId
              );
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
                const { __temp_rel_member, __temp_rel_type } = form.getValues();

                if (__temp_rel_member && __temp_rel_type) {
                  append({
                    relatedMemberId: __temp_rel_member,
                    type: __temp_rel_type,
                  });
                } else {
                  toast({
                    title: "Please select a member and relationship type.",
                    variant: "destructive",
                  });
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
                <Input
                  type="date"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
