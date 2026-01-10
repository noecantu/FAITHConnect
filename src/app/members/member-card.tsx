
'use client';

import Image from 'next/image';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    {
      'bg-background/50': status === 'Archived',
    }
  );

  return (
    <Badge variant={variant as any} className={className}>
      {status}
    </Badge>
  );
};

export function MemberCard({ member }: { member: Member }) {
  return (
    <MemberFormSheet member={member}>
      <Card className="overflow-hidden cursor-pointer">
        <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-muted text-muted-foreground">
          {member.profilePhotoUrl ? (
            <Image
              src={member.profilePhotoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-medium">No Image Added</span>
          )}
          <StatusBadge status={member.status} />
        </div>
        <CardHeader className="flex-row items-start justify-between pb-2">
          <div className="flex flex-col">
            <CardTitle className="text-xl">{`${member.firstName} ${member.lastName}`}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <a
              href={`mailto:${member.email}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {member.email}
            </a>
            <a
              href={`tel:${member.phoneNumber}`}
              className="block hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {member.phoneNumber}
            </a>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </MemberFormSheet>
  );
}
