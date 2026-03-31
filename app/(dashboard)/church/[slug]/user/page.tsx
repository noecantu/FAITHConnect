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
import { isAdmin, Role } from "@/app/lib/roleGroups";

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
      setUser(profile);
      setLoadingUser(false);
    }
    load();
  }, []);

  const churchId = user?.churchId ?? null;

  const { church, loading: loadingChurch } = useChurch(churchId);
  const { events, loading: loadingEvents } = useUpcomingEvents(churchId, user);
  const { services, loading: loadingServices } = useUpcomingServices(churchId, user);

  const isAdminUser = user ? isAdmin(user.roles) : false;

  if (loadingUser || loadingChurch || loadingEvents || loadingServices) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) return <div className="p-6">No user found.</div>;
  if (!church) return <div className="p-6">No church found.</div>;

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background/80 backdrop-blur">
          <div className="px-4 md:px-8 py-4">
            <PageHeader
              title="My Dashboard"
              subtitle="Your upcoming events and schedule."
            />
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 space-y-6">

          {/* Identity Header — Two Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Church Identity Card */}
            <Card className="border border-border bg-card/80">
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

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {church.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Timezone: {church.timezone}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Identity Card */}
            <Card className="border border-border bg-card/80 transition">
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
            <Card className="border border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump into your church activity.</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickAction href={`/church/${slug}/user/services`} icon={CalendarHeart} label="Upcoming Services" />
                <QuickAction href={`/church/${slug}/user/events`} icon={Calendar} label="Events" />
                <QuickAction href={`/church/${slug}/user/schedule`} icon={CalendarCheck} label="My Schedule" />
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events + Upcoming Services side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Upcoming Events */}
            <Card className="border border-border bg-card/80">
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
            <Card className="border border-border bg-card/80">
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
    </div>
  );
}

/* ---------------------------
   Small Components
--------------------------- */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function QuickAction({ href, icon: Icon, label }: { href: string; icon: IconType; label: string }) {
  return (
    <Button
      asChild
      variant="outline"
      className="w-full justify-start gap-2 border-border bg-background/60 hover:bg-muted/70"
    >
      <Link href={href}>
        <Icon className="h-4 w-4 text-foreground/70" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
