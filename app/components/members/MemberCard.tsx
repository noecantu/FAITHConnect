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
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

import type { Member } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';
import { formatPhone } from '@/app/lib/formatters';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useRouter } from 'next/navigation';

//
// STATUS BADGE
//
const StatusBadge = ({ status }: { status: Member['status'] }) => {
  if (status === 'Active') return null;

  if (status === 'Prospect') {
    return <Badge className="bg-yellow-700 text-white">Prospect</Badge>;
  }

  if (status === 'Archived') {
    return (
      <Badge className="bg-black text-foreground/70">
        Archived
      </Badge>
    );
  }

  return null;
};

//
// UPCOMING EVENT BADGE
//
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

//
// FINAL MEMBER CARD
//
export default function MemberCard({
  member,
  allMembers = [],
  showPhoto = true,
  readOnly = false,
  searchAction,
}: {
  member: Member;
  allMembers?: Member[];
  showPhoto?: boolean;
  readOnly?: boolean;
  searchAction?: (name: string) => void;
}) {
  const router = useRouter();
  const { churchId } = useChurchId();

  const { canManageMembers } = usePermissions();
  const canEdit = canManageMembers;

  //
  // EDITOR VERSION — card is clickable and navigates to edit page
  //
  if (canEdit && !readOnly) {
    return (
      <Card
        className={cn(
          "relative flex flex-col overflow-hidden bg-black/80 border-white/20 backdrop-blur-xl",
          !readOnly && "cursor-pointer"
        )}
        onClick={
          readOnly
            ? undefined
            : () => router.push(`/church/${churchId}/members/${member.id}`)
        }
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
              <UpcomingEventBadge
                dateString={member.birthday ?? undefined}
                label="Birthday"
              />

              <UpcomingEventBadge
                dateString={member.anniversary ?? undefined}
                label="Anniversary"
              />
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
          <div className="space-y-2 text-sm text-muted-foreground">
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
                <UpcomingEventBadge
                  dateString={member.birthday ?? undefined}
                  label="Birthday"
                />

                <UpcomingEventBadge
                  dateString={member.anniversary ?? undefined}
                  label="Anniversary"
                />
              </div>
            )}
          </div>
        </CardContent>

        {/* RELATIONSHIPS */}
        {member.relationships && member.relationships.length > 0 && (
          <CardFooter className="flex-col items-start pt-0 px-6">
            <Separator className="mb-4 w-full" />

            <div className="space-y-2 text-sm text-muted-foreground w-full">
              {member.relationships.map((rel, index) => {
                const relatedMemberId = rel.memberIds.find(id => id !== member.id)
                const relatedMember = allMembers.find(m => m.id === relatedMemberId)

                return (
                  <div key={`${rel.type}-${rel.memberIds.join("-")}-${index}`}>
                    <span className="font-medium text-foreground">{rel.type}</span>
                    <span>
                      {' '}of{' '}
                      {relatedMember ? (
                        <button
                          className="text-blue-600 hover:underline p-0 bg-transparent border-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            searchAction?.(
                              `${relatedMember.firstName} ${relatedMember.lastName}`
                            )
                          }}
                        >
                          {relatedMember.firstName} {relatedMember.lastName}
                        </button>
                      ) : '...'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }

  //
  // NON‑EDITOR VERSION — card navigates to profile page
  //
  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden bg-black/80 border-white/20 backdrop-blur-xl",
        !readOnly && "cursor-pointer"
      )}
      onClick={
        readOnly
          ? undefined
          : () => router.push(`/church/${churchId}/members/${member.id}`)
      }
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
            <UpcomingEventBadge
              dateString={member.birthday ?? undefined}
              label="Birthday"
            />

            <UpcomingEventBadge
              dateString={member.anniversary ?? undefined}
              label="Anniversary"
            />
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
        <div className="space-y-2 text-sm text-muted-foreground">
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
              <UpcomingEventBadge
                dateString={member.birthday ?? undefined}
                label="Birthday"
              />

              <UpcomingEventBadge
                dateString={member.anniversary ?? undefined}
                label="Anniversary"
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* RELATIONSHIPS */}
      {member.relationships && member.relationships.length > 0 && (
        <CardFooter className="flex-col items-start pt-0 px-6">
          <Separator className="mb-4 w-full" />

          <div className="space-y-2 text-sm text-muted-foreground w-full">
            {member.relationships.map((rel, index) => {
              const relatedMemberId = rel.memberIds.find(id => id !== member.id)
              const relatedMember = allMembers.find(m => m.id === relatedMemberId)

              return (
                <div key={`${rel.type}-${rel.memberIds.join("-")}-${index}`}>
                  <span className="font-medium text-foreground">{rel.type}</span>
                  <span>
                    {' '}of{' '}
                    {relatedMember ? (
                      <button
                        className="text-blue-600 hover:underline p-0 bg-transparent border-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          searchAction?.(`${relatedMember.firstName} ${relatedMember.lastName}`)
                        }}
                      >
                        {relatedMember.firstName} {relatedMember.lastName}
                      </button>
                    ) : '...'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
