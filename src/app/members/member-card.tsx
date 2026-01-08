'use client';

import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MemberFormSheet } from './member-form-sheet';
import type { Member } from '@/lib/types';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status }: { status: Member['status'] }) => {
  if (status === 'Active') {
    return null;
  }
  const variant = {
    Prospect: 'default',
    Archived: 'outline',
  }[status];
  
  const className = cn(
    'absolute top-2 right-2',
    'bg-background/70'
  );

  return (
    <Badge
      variant={variant as any}
      className={className}
    >
      {status}
    </Badge>
  );
};

export function MemberCard({ member }: { member: Member }) {
  return (
    <AlertDialog>
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={member.photoUrl}
            alt={`${member.firstName} ${member.lastName}`}
            fill
            className="object-cover"
            data-ai-hint={member.imageHint}
          />
          <StatusBadge status={member.status} />
        </div>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl">{`${member.firstName} ${member.lastName}`}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(member.email)}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <MemberFormSheet member={member}>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                  Edit member
                </div>
              </MemberFormSheet>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Delete member
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{member.email}</p>
            <p>{member.phone}</p>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            member profile for {member.firstName} {member.lastName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => console.log(`Deleting member ${member.id}`)} // In a real app, call a server action
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
