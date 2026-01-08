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

  const className = cn('absolute top-2 right-2', {
    'bg-background/80': status === 'Prospect' || status === 'Archived',
  });

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
              href={`tel:${member.phone}`}
              className="block hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {member.phone}
            </a>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </MemberFormSheet>
  );
}
