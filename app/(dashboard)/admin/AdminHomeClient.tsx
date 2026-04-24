"use client";

import Link from "next/link";
import { PageHeader } from "@/app/components/page-header";
import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { DashboardMetricCard } from "@/app/components/ui/dashboard-cards";
import {
  Building2,
  Users,
  Map,
  MapPinned,
  ShieldCheck,
  CalendarDays,
  ClipboardCheck,
  Music2,
  ListMusic,
  UserCog,
  Banknote,
  ChevronRight,
  ScrollText,
  Activity,
  CreditCard,
  Settings,
} from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}

function StatCard({ icon, label, value, description }: StatCardProps) {
  const safeValue = value === -1 ? 0 : value;
  return (
    <DashboardMetricCard
      title={label}
      value={safeValue}
      description={value === -1 ? "Unable to load this metric" : description}
      icon={icon}
    />
  );
}

interface ToolCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ToolCard({ href, icon, title, description }: ToolCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="cursor-pointer interactive-card interactive-card-focus transition-colors border-white/10 bg-black/45 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{title}</p>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminHomeClient({
  churchCount,
  districtCount,
  regionCount,
  userCount,
  adminCount,
  eventCount,
  checkinCount,
  musicItemCount,
  setlistCount,
  churchLeaderCount,
  financeCount,
}: {
  churchCount: number;
  districtCount: number;
  regionCount: number;
  userCount: number;
  adminCount: number;
  eventCount: number;
  checkinCount: number;
  musicItemCount: number;
  setlistCount: number;
  churchLeaderCount: number;
  financeCount: number;
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="FAITH Connect"
        subtitle="System-wide overview and administrative controls."
      />

      <Separator />

      {/* Platform Stats */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <StatCard icon={<Building2 className="h-4 w-4 text-emerald-500" />} label="Churches" value={churchCount} description="Churches across the platform" />
          <StatCard icon={<MapPinned className="h-4 w-4 text-indigo-500" />} label="Districts" value={districtCount} description="Districts configured in the platform" />
          <StatCard icon={<Map className="h-4 w-4 text-sky-500" />} label="Regions" value={regionCount} description="Regions configured in the platform" />
          <StatCard icon={<Users className="h-4 w-4 text-blue-500" />} label="Total Users" value={userCount} description="All non-system and system users" />
          <StatCard icon={<ShieldCheck className="h-4 w-4 text-fuchsia-500" />} label="Church Administrators" value={adminCount} description="Users with church admin access" />
          <StatCard icon={<UserCog className="h-4 w-4 text-cyan-500" />} label="Church Leaders" value={churchLeaderCount} description="Churches with leader information" />
          <StatCard icon={<Banknote className="h-4 w-4 text-teal-500" />} label="Finance Managers" value={financeCount} description="Users with finance access" />
        </div>
      </section>

      {/* Activity & Content Stats */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Activity &amp; Content
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard icon={<CalendarDays className="h-4 w-4 text-sky-500" />} label="Events" value={eventCount} description="Events across all churches" />
          <StatCard icon={<ClipboardCheck className="h-4 w-4 text-amber-500" />} label="Check-ins" value={checkinCount} description="Attendance entries across churches" />
          <StatCard icon={<Music2 className="h-4 w-4 text-emerald-500" />} label="Songs" value={musicItemCount} description="Songs stored across churches" />
          <StatCard icon={<ListMusic className="h-4 w-4 text-emerald-500" />} label="Set Lists" value={setlistCount} description="Set lists created across churches" />
        </div>
      </section>

      <Separator />

      {/* Management Tools */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Management Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToolCard
            href="/admin/churches"
            icon={<Building2 className="h-5 w-5" />}
            title="Churches"
            description="Create, edit, and manage all churches."
          />
          <ToolCard
            href="/admin/all-users"
            icon={<Users className="h-5 w-5" />}
            title="All Users"
            description="Manage all non-system users across churches."
          />          <ToolCard
            href="/admin/users"
            icon={<Users className="h-5 w-5" />}
            title="System Users"
            description="View and manage system-level users."
          />
          <ToolCard
            href="/admin/logs"
            icon={<ScrollText className="h-5 w-5" />}
            title="Activity Logs"
            description="System-wide events and audit trails."
          />
          <ToolCard
            href="/admin/settings/health"
            icon={<Activity className="h-5 w-5" />}
            title="Platform Health"
            description="Performance, metrics, and uptime."
          />
          <ToolCard
            href="/admin/subscription-audit"
            icon={<CreditCard className="h-5 w-5" />}
            title="Subscription Audit"
            description="Verify all valid active subscriptions."
          />
          <ToolCard
            href="/admin/settings"
            icon={<Settings className="h-5 w-5" />}
            title="System Settings"
            description="Global configuration and platform settings."
          />
        </div>
      </section>
    </div>
  );
}