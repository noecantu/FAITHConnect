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
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import {
  CalendarCheck,
  CalendarHeart,
  Calendar,
  // Music,
  // UserPlus,
  // LayoutDashboard,
} from "lucide-react";
import { UserFormSheet } from "./profile/user-form-sheet";

export default function UserDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { church, loading: loadingChurch } = useChurch(user?.churchId ?? null);
  const { services, loading: loadingServices } = useUpcomingServices(user?.churchId ?? null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      const profile: UserProfile = await res.json();

          console.log("User profile from /api/users/me:", profile); // ← THIS ONE

      setUser(profile);
      setLoadingUser(false);
    }
    load();
  }, []);

  if (loadingUser || loadingChurch) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">No user found.</div>;
  }

  if (!church) {
    return <div className="p-6">No church found.</div>;
  }

  if (loadingServices) {
    return <div className="p-6">Loading...</div>;
  }

  const initials = church.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-muted/20">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden">
            {church.logoUrl ? (
              <Image
                src={church.logoUrl}
                alt="Church Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full p-1.5"
              />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                {initials}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate">{church.name}</span>
            <span className="text-xs text-muted-foreground">{church.timezone}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <SidebarLink href={`/church/${slug}/user`} label="My Dashboard" active />
          <SidebarLink href={`/church/${slug}/user/schedule`} label="My Schedule" />
          <SidebarLink href={`/church/${slug}/user/services`} label="Upcoming Services" />
          <SidebarLink href={`/church/${slug}/user/events`} label="Events" />
          <SidebarLink href={`/church/${slug}/user/profile`} label="My Profile" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background/80 backdrop-blur">
          <div className="px-4 md:px-8 py-4">
            <PageHeader
              title="My Dashboard"
              subtitle="Your upcoming services, events, and schedule."
            />
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 space-y-6">
          {/* Identity Header */}
          <UserFormSheet user={user}>
            <Card className="border border-border bg-card/80 cursor-pointer hover:bg-muted/50 transition">
              <CardContent className="flex items-center gap-4 p-4 md:p-6">
                <Avatar className="h-14 w-14">
                  {user.profilePhotoUrl ? (
                    <Image
                      src={user.profilePhotoUrl}
                      alt="Profile Photo"
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {user.displayName?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold">
                    {user.firstName || user.lastName
                      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                      : user.displayName}
                  </h1>

                  <p className="text-sm text-muted-foreground">{user.email}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </UserFormSheet>

          {/* Quick Actions */}
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

          {/* Upcoming */}
          <Card className="border border-border bg-card/80">
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
              <CardDescription>Your next scheduled services.</CardDescription>
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
      </main>
    </div>
  );
}

/* ---------------------------
   Small Components
--------------------------- */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function SidebarLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        ].join(" ")}
      >
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: IconType,
  label: string;
}) {
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

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
