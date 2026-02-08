'use client';

import Image from 'next/image';
import {
  isWithinInterval,
  addDays,
  parseISO,
  setYear,
  getYear,
  isBefore,
  startOfToday,
  format,
} from 'date-fns';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

import { MemberFormSheet } from './member-form-sheet';
import type { Member } from '../lib/types';
import { cn } from '../lib/utils';
import { listenToMembers } from '../lib/members';
import { useChurchId } from '../hooks/useChurchId';
import { useState, useEffect } from 'react';
import { formatPhone } from '../lib/formatters';
import { useUserRoles } from "../hooks/useUserRoles";

const StatusBadge = ({ status }: { status: Member['status'] }) => {
  if (status === 'Active') return null;

  if (status === 'Prospect') {
    return <Badge variant="default">Prospect</Badge>;
  }

  if (status === 'Archived') {
    return (
      <Badge className="bg-muted text-foreground/70 border border-border">
        Archived
      </Badge>
    );
  }

  return null;
};

const UpcomingEventBadge = ({
  dateString,
  label,
}: {
  dateString?: string;
  label: string;
}) => {
  if (!dateString) return null;

  const isDateWithinAWeek = () => {
    const today = startOfToday();
    try {
      const eventDate = parseISO(dateString);
      let thisYearEvent = setYear(eventDate, getYear(today));

      if (isBefore(thisYearEvent, today)) {
        thisYearEvent = setYear(eventDate, getYear(today) + 1);
      }

      const sevenDaysFromNow = addDays(today, 7);
      return isWithinInterval(thisYearEvent, {
        start: today,
        end: sevenDaysFromNow,
      });
    } catch {
      return false;
    }
  };

  if (!isDateWithinAWeek()) return null;

  const isBirthday = label === 'Birthday';

  return (
    <Badge
      variant={isBirthday ? 'default' : 'destructive'}
      className={cn(
        'animate-pulse',
        isBirthday &&
          'border-transparent bg-blue-600 text-white hover:bg-blue-600/80'
      )}
    >
      Upcoming {label}
    </Badge>
  );
};

export function MemberCard({
  member,
  searchAction,
  cardView,
}: {
  member: Member;
  searchAction: (name: string) => void;
  cardView: "show" | "hide";
}) {
  const churchId = useChurchId();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const { isAdmin, isMemberManager } = useUserRoles(churchId);
  const canEdit = isAdmin || isMemberManager;
  
  useEffect(() => {
    if (!churchId) return;
    const unsubscribe = listenToMembers(churchId, (members) => {
      setAllMembers(members);
    });
    return () => unsubscribe();
  }, [churchId]);

  const showPhoto = cardView === 'show';

  return (
    <div className="h-full">
      {canEdit ? (
        // EDITORS ONLY — card opens edit sheet
        <MemberFormSheet member={member}>
          <Card
            className="flex flex-col overflow-hidden cursor-pointer"
            onClick={(e) => {
              // Prevent email/phone links from triggering the sheet
              e.stopPropagation();
            }}
          >
            {/* PHOTO SECTION */}
            {showPhoto && (
              <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-muted text-muted-foreground">
                {member.profilePhotoUrl ? (
                  <Image
                    src={member.profilePhotoUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    fill
                    className={cn(
                      'object-cover',
                      member.status === 'Archived' && 'grayscale'
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <span className="text-sm font-medium">No Image Added</span>
                )}
  
                <div className="absolute top-2 right-2">
                  <StatusBadge status={member.status} />
                </div>
  
                <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
                  <UpcomingEventBadge dateString={member.birthday} label="Birthday" />
                  <UpcomingEventBadge dateString={member.anniversary} label="Anniversary" />
                </div>
              </div>
            )}
  
            <CardHeader className="flex-row items-start justify-between pb-2">
              <CardTitle className="text-xl">
                {member.lastName}, {member.firstName}
              </CardTitle>
  
              {!showPhoto && <StatusBadge status={member.status} />}
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
                  {formatPhone(member.phoneNumber)}
                </a>
  
                {member.baptismDate && (
                  <p className="text-foreground">
                    Baptized: {format(new Date(member.baptismDate), 'MM-dd-yyyy')}
                  </p>
                )}
  
                {!showPhoto && (
                  <div className="flex flex-col gap-1 pt-2">
                    <UpcomingEventBadge dateString={member.birthday} label="Birthday" />
                    <UpcomingEventBadge dateString={member.anniversary} label="Anniversary" />
                  </div>
                )}
              </div>
            </CardContent>
  
            {member.relationships && member.relationships.length > 0 && (
              <CardFooter className="flex-col items-start pt-0">
                <Separator className="mb-4 w-full" />
                <div className="space-y-2 text-sm w-full">
                  {member.relationships.map((rel) => {
                    const relatedMemberId = rel.memberIds.find(
                      (id) => id !== member.id
                    );
                    const relatedMember = allMembers.find(
                      (m) => m.id === relatedMemberId
                    );
  
                    return (
                      <div key={relatedMemberId}>
                        <span className="font-medium text-foreground">
                          {rel.type}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          of{' '}
                          {relatedMember ? (
                            <button
                              className="text-blue-600 hover:underline p-0 bg-transparent border-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                searchAction(`${relatedMember.firstName} ${relatedMember.lastName}`);
                              }}
                            >
                              {relatedMember.firstName} {relatedMember.lastName}
                            </button>
                          ) : (
                            '...'
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardFooter>
            )}
          </Card>
        </MemberFormSheet>
      ) : (
        // NON-EDITORS — card is NOT clickable
        <Card className="flex flex-col overflow-hidden">
          {/* PHOTO SECTION */}
          {showPhoto && (
            <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-muted text-muted-foreground">
              {member.profilePhotoUrl ? (
                <Image
                  src={member.profilePhotoUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  fill
                  className={cn(
                    'object-cover',
                    member.status === 'Archived' && 'grayscale'
                  )}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <span className="text-sm font-medium">No Image Added</span>
              )}
  
              <div className="absolute top-2 right-2">
                <StatusBadge status={member.status} />
              </div>
  
              <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
                <UpcomingEventBadge dateString={member.birthday} label="Birthday" />
                <UpcomingEventBadge dateString={member.anniversary} label="Anniversary" />
              </div>
            </div>
          )}
  
          <CardHeader className="flex-row items-start justify-between pb-2">
            <CardTitle className="text-xl">
              {member.lastName}, {member.firstName}
            </CardTitle>
  
            {!showPhoto && <StatusBadge status={member.status} />}
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
                {formatPhone(member.phoneNumber)}
              </a>
  
              {member.baptismDate && (
                <p className="text-foreground">
                  Baptized: {format(new Date(member.baptismDate), 'MM-dd-yyyy')}
                </p>
              )}
  
              {!showPhoto && (
                <div className="flex flex-col gap-1 pt-2">
                  <UpcomingEventBadge dateString={member.birthday} label="Birthday" />
                  <UpcomingEventBadge dateString={member.anniversary} label="Anniversary" />
                </div>
              )}
            </div>
          </CardContent>
  
          {member.relationships && member.relationships.length > 0 && (
            <CardFooter className="flex-col items-start pt-0">
              <Separator className="mb-4 w-full" />
              <div className="space-y-2 text-sm w-full">
                {member.relationships.map((rel) => {
                  const relatedMemberId = rel.memberIds.find(
                    (id) => id !== member.id
                  );
                  const relatedMember = allMembers.find(
                    (m) => m.id === relatedMemberId
                  );
  
                  return (
                    <div key={relatedMemberId}>
                      <span className="font-medium text-foreground">
                        {rel.type}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        of{' '}
                        {relatedMember ? (
                          <button
                            className="text-blue-600 hover:underline p-0 bg-transparent border-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              searchAction(`${relatedMember.firstName} ${relatedMember.lastName}`);
                            }}
                          >
                            {relatedMember.firstName} {relatedMember.lastName}
                          </button>
                        ) : (
                          '...'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );  
}
