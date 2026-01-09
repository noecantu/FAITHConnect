
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Member } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, addDoc, updateDoc, deleteDoc, collection, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useChurchId } from "@/hooks/useChurchId";

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  birthday: z.string().optional(),
  status: z.enum(['Active', 'Prospect', 'Archived']),
  notes: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormSheetProps {
  member?: Member;
  children?: ReactNode;
}

export async function addMember(churchId: string, data: MemberFormValues) {
  const ref = collection(db, "churches", churchId, "members");

  return await addDoc(ref, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    birthday: data.birthday ? new Date(data.birthday) : null,
    status: data.status,
    notes: data.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function updateMember(
  churchId: string,
  memberId: string,
  data: MemberFormValues
) {
  const ref = doc(db, "churches", churchId, "members", memberId);

  return await updateDoc(ref, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    birthday: data.birthday ? new Date(data.birthday) : null,
    status: data.status,
    notes: data.notes ?? "",
    updatedAt: serverTimestamp(),
  });
}
export async function deleteMember(churchId: string, memberId: string) {
  const ref = doc(db, "churches", churchId, "members", memberId);
  return await deleteDoc(ref);
}
export function listenToMembers(churchId: string, callback: (members: Member[]) => void) {
  const q = query(
    collection(db, "churches", churchId, "members"),
    orderBy("lastName", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc) => {
      const raw = doc.data();
    
      return {
        id: doc.id,
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: raw.email,
        phone: raw.phone,
        birthday: raw.birthday?.toDate?.() ?? null,
        status: raw.status,
        notes: raw.notes ?? "",
    
        // Add defaults so the object matches the Member type
        photoUrl: raw.photoUrl ?? "",
        imageHint: raw.imageHint ?? "",
      };
    });

    callback(members);
  });
}
export function MemberFormSheet({ member, children }: MemberFormSheetProps) {
  const { toast } = useToast();
  const isEditMode = !!member;
  const churchId = useChurchId();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
      status: 'Prospect',
      notes: '',
    },
  });
  
  useEffect(() => {
    // Reset form when dialog opens for "Add" or when "member" prop changes for "Edit"
    if (isOpen) {
      if (isEditMode && member) {
        form.reset({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          birthday: member.birthday
            ? new Date(member.birthday).toISOString().split('T')[0]
            : '',
          status: member.status,
          notes: member.notes ?? '',
        });
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          birthday: '',
          status: 'Prospect',
          notes: '',
        });
      }
    }
  }, [isOpen, isEditMode, member, form]);
  
  async function onSubmit(data: MemberFormValues) {
    if (!churchId) {
      toast({
        title: "Error",
        description: "Church ID is missing. Cannot save member.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && member) {
        await updateMember(churchId, member.id, data);
        toast({
          title: "Member Updated",
          description: `Profile for ${data.firstName} ${data.lastName} has been updated.`,
        });
      } else {
        await addMember(churchId, data);
        toast({
          title: "Member Added",
          description: `Profile for ${data.firstName} ${data.lastName} has been created.`,
        });
      }
      setIsOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Error saving member:", error);
      toast({
        title: "Error",
        description: "Something went wrong while saving the member.",
        variant: "destructive",
      });
    }
  }

  const trigger = children ? (
    <DialogTrigger asChild>{children}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Member
      </Button>
    </DialogTrigger>
  );

  return (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
              {trigger}

              {/* On mobile: force full-screen and neutralize the default center transform. 
                  On desktop: revert to centered with a readable max width & height. */}
              <DialogContent
          className={`
            pointer-events-auto
            flex flex-col
            p-0 bg-background

            /* Mobile full-screen (sm and below) */
            !left-0 !top-0 !-translate-x-0 !-translate-y-0
            w-[100vw] h-[100dvh] max-h-[100dvh]

            /* Safe-area padding so the header/footer don't get cut by notch/home bar */
            sm:!left-1/2 sm:!top-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2
            sm:w-[calc(100vw-2rem)]
            sm:max-w-2xl
            sm:max-h-[90vh]
          `}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
        {/* Header (fixed) */}
        <DialogHeader className="shrink-0 px-4 py-4 sm:px-6">
          <DialogTitle>
            {isEditMode ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update the profile for ${member?.firstName} ${member?.lastName}.`
              : 'Add a new member to the directory. Required fields are marked with *'}
          </DialogDescription>
        </DialogHeader>

        {/* Middle: single scrollable region */}
        <div
          className={`
            grow
            px-4 sm:px-6
            overflow-y-auto
            [webkit-overflow-scrolling:touch]
            min-w-0
            pb-[calc(var(--footer-h,3.5rem)+env(safe-area-inset-bottom)+0.75rem)]
          `}
        >
          <Form {...form}>
            <form
              id="member-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full min-w-0"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input className="block w-full min-w-0" placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input className="block w-full min-w-0" placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className="block w-full min-w-0"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        className="block w-full min-w-0"
                        placeholder="123-456-7890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birthday — iPhone width corrected */}
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="block w-full min-w-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select a status" />
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information about the member..."
                        className="block w-full min-w-0 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer (fixed) */}
        <DialogFooter
          className="shrink-0 px-4 py-3 sm:px-6"
          style={{ ['--footer-h' as any]: '3.5rem' }}
        >
          <Button
            type="submit"
            form="member-form"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : (isEditMode ? 'Save Changes' : 'Add Member')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
