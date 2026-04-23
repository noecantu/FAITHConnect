"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import {
  Building2,
  Users,
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
}

function StatCard({ icon, label, value }: StatCardProps) {
  const display = value === -1 ? "Error" : value.toLocaleString();
  return (
    <Card className="flex flex-col justify-between p-5 gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{display}</p>
    </Card>
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
      <Card className="cursor-pointer interactive-card interactive-card-focus transition-colors">
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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">FAITH Connect</h1>
          </div>
          <p className="text-muted-foreground">
            System-wide overview and administrative controls.
          </p>
        </div>
      </div>

      <Separator />

      {/* Platform Stats */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={<Building2 className="h-4 w-4" />} label="Churches" value={churchCount} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={userCount} />
          <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Church Administrators" value={adminCount} />
          <StatCard icon={<UserCog className="h-4 w-4" />} label="Church Leaders" value={churchLeaderCount} />
          <StatCard icon={<Banknote className="h-4 w-4" />} label="Finance Managers" value={financeCount} />
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
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Events" value={eventCount} />
          <StatCard icon={<ClipboardCheck className="h-4 w-4" />} label="Check-ins" value={checkinCount} />
          <StatCard icon={<Music2 className="h-4 w-4" />} label="Songs" value={musicItemCount} />
          <StatCard icon={<ListMusic className="h-4 w-4" />} label="Set Lists" value={setlistCount} />
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