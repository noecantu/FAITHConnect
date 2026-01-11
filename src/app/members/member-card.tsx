
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
import { Separator } from '@/components/ui/separator';

import { MemberFormSheet } from './member-form-sheet';
import type { Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { listenToMembers } from '@/lib/members';
import { useChurchId } from '@/hooks/useChurchId';
import { useState, useEffect } from 'react';

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
  const churchId = useChurchId();
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!churchId) return;
    const unsubscribe = listenToMembers(churchId, (members) => {
      setAllMembers(members);
    });
    return () => unsubscribe();
  }, [churchId]);

  return (
    <MemberFormSheet member={member}>
      <Card className="overflow-hidden cursor-pointer flex flex-col h-full">
        <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-muted text-muted-foreground">
          {member.profilePhotoUrl ? (
            <Image
              src={member.profilePhotoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        <CardContent className="flex-grow">
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
        {member.relationships && member.relationships.length > 0 && (
          <CardFooter className="flex-col items-start pt-0">
            <Separator className="mb-4 w-full" />
            <div className="space-y-2 text-sm w-full">
              {member.relationships.map((rel) => {
                const relatedMemberId = rel.memberIds.find(id => id !== member.id);
                const relatedMember = allMembers.find(m => m.id === relatedMemberId);
                return (
                  <div key={relatedMemberId}>
                    <span className="font-medium text-foreground">{rel.type}</span>
                    <span className="text-muted-foreground"> of {relatedMember ? `${relatedMember.firstName} ${relatedMember.lastName}` : '...'}</span>
                  </div>
                );
              })}
            </div>
          </CardFooter>
        )}
      </Card>
    </MemberFormSheet>
  );
}
