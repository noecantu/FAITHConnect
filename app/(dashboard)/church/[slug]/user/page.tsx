'use client';

import { use } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { UserProfile } from "@/app/lib/types";
import { useChurch } from "@/app/hooks/useChurch";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { CalendarCheck, CalendarHeart, Calendar } from "lucide-react";
import { useUpcomingEvents } from "@/app/hooks/useUpcomingEvents";
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import type { Role } from "@/app/lib/auth/roles";
import { can } from "@/app/lib/auth/permissions";
import { PageHeader } from "@/app/components/page-header";
import { formatPhone } from "@/app/lib/formatters";
import { ChurchDisabledNotice } from "@/app/components/layout/ChurchDisabledNotice";
import { BillingLapsedNotice } from "@/app/components/layout/BillingLapsedNotice";

export default function UserDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user on mount
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      const raw = await res.json();
      const profile: UserProfile = {
        ...raw,
        roles: raw.roles as Role[],
      };
      setUser(profile);
      setLoadingUser(false);
    }
    load();
  }, []);

  const churchId = user?.churchId ?? null;

  const { church, loading: loadingChurch } = useChurch(churchId);
  const { events, loading: loadingEvents } = useUpcomingEvents(churchId);
  const { services, loading: loadingServices } = useUpcomingServices(churchId);

  const isAdminUser = user ? can(user.roles, "church.manage") : false;

  if (loadingUser || loadingChurch || loadingEvents || loadingServices) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) return <div className="p-6">No user found.</div>;
  if (!church) return <div className="p-6">No church found.</div>;

  if (church.billingDelinquent) {
    return (
      <main className="flex-1 flex flex-col">
        <PageHeader
          title="My Dashboard"
          subtitle="Your church's subscription requires attention."
        />
        <div className="flex-1 py-6 space-y-6">
          <BillingLapsedNotice churchName={church.name} isAdmin={false} />
        </div>
      </main>
    );
  }

  if (church.status === "disabled") {
    return (
      <main className="flex-1 flex flex-col">
        <PageHeader
          title="My Dashboard"
          subtitle="Your church is currently in restricted mode."
        />
        <div className="flex-1 py-6 space-y-6">
          <ChurchDisabledNotice churchName={church.name} />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 flex flex-col">
        <PageHeader
          title="My Dashboard"
          subtitle="Your upcoming events and schedule."
        />
        <div className="flex-1 py-6 space-y-6">

          {/* Identity Header — Two Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Church Identity Card */}
            <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
              <CardContent className="flex items-center gap-4 p-4 md:p-6">
                <Avatar className="h-32 w-32 rounded-md overflow-hidden border border-border bg-white shadow-sm">
                  {church.logoUrl ? (
                    <Image
                      src={church.logoUrl}
                      alt="Church Logo"
                      fill
                      sizes="80px"
                      className="object-cover"
                      loading="eager"
                      priority
                    />
                  ) : (
                    <AvatarFallback className="rounded-md text-xl">
                      {church.name?.[0]?.toUpperCase() ?? "C"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {church.name}
                  </h2>

                  {(church.leaderTitle || church.leaderName) && (
                    <p className="text-sm text-muted-foreground">
                      {church.leaderTitle ? church.leaderTitle + " " : ""}
                      {church.leaderName ?? ""}
                    </p>
                  )}
                  {(() => {
                    const line1 = (church.address_1 ?? church.address ?? "").trim();
                    const line2 = (church.address_2 ?? "").trim();
                    if (!line1 && !line2) return null;
                    return (
                      <>
                        {line1 && <p className="text-sm text-muted-foreground">{line1}</p>}
                        {line2 && <p className="text-sm text-muted-foreground">{line2}</p>}
                      </>
                    );
                  })()}
                  {(church.city || church.state || church.zip) && (
                    <p className="text-sm text-muted-foreground">
                      {[church.city, church.state].filter(Boolean).join(", ")}
                      {church.zip ? ` ${church.zip}` : ""}
                    </p>
                  )}
                  {church.phone && (
                    <p className="text-sm text-muted-foreground">{formatPhone(church.phone)}</p>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* User Identity Card */}
            <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
              <CardContent className="flex items-center gap-4 p-4 md:p-6">
                <Avatar className="h-32 w-32 rounded-md overflow-hidden border border-border bg-white shadow-sm">
                  {user.profilePhotoUrl ? (
                    <Image
                      src={user.profilePhotoUrl}
                      alt="Profile Photo"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="rounded-md text-xl">
                      {user.displayName?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <h1 className="text-lg font-semibold truncate">
                    {user.firstName || user.lastName
                      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                      : user.displayName}
                  </h1>

                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2 min-w-0">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border truncate max-w-[120px]"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions — Admin Only */}
          {isAdminUser && (
            <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump into your church activity.</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickAction
                  href={`/church/${slug}/user/services`}
                  icon={CalendarHeart}
                  label="Upcoming Services"
                  iconClassName="text-violet-500"
                />
                <QuickAction
                  href={`/church/${slug}/user/events`}
                  icon={Calendar}
                  label="Events"
                  iconClassName="text-sky-500"
                />
                <QuickAction
                  href={`/church/${slug}/user/schedule`}
                  icon={CalendarCheck}
                  label="My Schedule"
                  iconClassName="text-amber-500"
                />
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events + Upcoming Services side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Upcoming Events */}
            <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>What’s happening soon at your church.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming events.</p>
                )}

                {events.map((event) => (
                  <div key={event.id} className="border-b border-border pb-3 last:border-none">
                    <div className="font-medium">{event.title}</div>

                    <div className="text-sm text-muted-foreground">
                      {event.dateString}
                    </div>

                    {event.visibility === "private" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Private Event
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Services */}
            <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Upcoming Services</CardTitle>
                <CardDescription>Your upcoming worship services.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming services.</p>
                )}

                {services.map((service) => (
                  <div key={service.id} className="border-b border-border pb-3 last:border-none">
                    <div className="font-medium">{service.title}</div>

                    <div className="text-sm text-muted-foreground">
                      {service.dateString} at {service.timeString}
                    </div>
                    
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </>
  );
}

/* ---------------------------
   Small Components
--------------------------- */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function QuickAction({
  href,
  icon: Icon,
  label,
  iconClassName,
}: {
  href: string;
  icon: IconType;
  label: string;
  iconClassName?: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="w-full justify-start gap-2 border-border bg-background/60 hover:bg-muted/70"
    >
      <Link href={href}>
        <Icon className={`h-4 w-4 ${iconClassName ?? "text-foreground/70"}`} />
        <span>{label}</span>
      </Link>
    </Button>
  );
}