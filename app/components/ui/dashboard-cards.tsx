import Link from "next/link";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface DashboardSummaryCardProps {
  eyebrow: string;
  name: string;
  subtitle: string;
  logoUrl?: string | null;
  logoAlt: string;
  fallback: string;
  chips?: string[];
}

export function DashboardSummaryCard({
  eyebrow,
  name,
  subtitle,
  logoUrl,
  logoAlt,
  fallback,
  chips = [],
}: DashboardSummaryCardProps) {
  return (
    <Card className="p-5 rounded-xl border border-white/15 bg-gradient-to-br from-black/70 via-black/55 to-black/35 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.28)] space-y-3">
      <p className="text-xs uppercase tracking-[0.16em] text-white/60">{eyebrow}</p>

      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-16 w-16 rounded-lg object-cover border border-white/20 bg-black/30"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-white/5 flex items-center justify-center text-sm font-semibold text-white/75 border border-white/20">
            {fallback}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight truncate">{name}</p>
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/70"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

interface DashboardMetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

export function DashboardMetricCard({ title, value, description, icon }: DashboardMetricCardProps) {
  return (
    <Card className="p-4 rounded-xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="rounded-md border border-white/20 bg-white/5 p-2">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mt-1.5">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-1 opacity-70">{description}</p>
    </Card>
  );
}

interface DashboardApprovalBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  href: string;
  actionLabel: string;
}

export function DashboardApprovalBanner({
  eyebrow,
  title,
  description,
  count,
  countLabel,
  href,
  actionLabel,
}: DashboardApprovalBannerProps) {
  return (
    <Card className="p-5 bg-black/60 border-yellow-500/40 backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-yellow-300/80">{eyebrow}</p>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-[72px] rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{count}</p>
            <p className="text-[11px] uppercase tracking-wide text-yellow-100/70">{countLabel}</p>
          </div>

          <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-400">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface DashboardQuickAction {
  href: string;
  label: string;
  variant?: "default" | "outline";
}

interface DashboardIconQuickAction {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardQuickActionsCardProps {
  title: string;
  description: string;
  actions: DashboardQuickAction[];
}

export function DashboardQuickActionsCard({
  title,
  description,
  actions,
}: DashboardQuickActionsCardProps) {
  return (
    <Card className="p-5 bg-black/60 border-white/15 backdrop-blur-xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.href}
            asChild
            variant={action.variant === "default" ? "default" : "outline"}
            className={
              action.variant === "default"
                ? "justify-start bg-yellow-500 text-black hover:bg-yellow-400"
                : "justify-start border-white/15 bg-white/5 hover:bg-white/10"
            }
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

interface DashboardIconQuickActionsCardProps {
  title: string;
  description: string;
  actions: DashboardIconQuickAction[];
}

export function DashboardIconQuickActionsCard({
  title,
  description,
  actions,
}: DashboardIconQuickActionsCardProps) {
  return (
    <Card className="p-5 bg-black/60 border-white/15 backdrop-blur-xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.href}
            asChild
            variant="outline"
            className="justify-start gap-3 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
          >
            <Link href={action.href}>
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

interface DashboardApprovalRequestCardProps {
  name: string;
  logoUrl?: string | null;
  logoAlt: string;
  fallback: string;
  subtitle?: string | null;
  meta?: string | null;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
}

export function DashboardApprovalRequestCard({
  name,
  logoUrl,
  logoAlt,
  fallback,
  subtitle,
  meta,
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: DashboardApprovalRequestCardProps) {
  return (
    <Card className="relative flex flex-col overflow-hidden bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
      {/* Top logo / image section */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-white/5 border-b border-white/10">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={logoAlt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/30">
            <span className="text-5xl font-bold tracking-wide">{fallback}</span>
            <span className="text-xs uppercase tracking-widest">No Logo Added</span>
          </div>
        )}
      </div>

      {/* Name and details */}
      <div className="px-5 pt-4 pb-1 min-w-0">
        <p className="text-lg font-semibold truncate">{name}</p>
        {subtitle ? <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p> : null}
        {meta ? <p className="text-sm text-muted-foreground mt-0.5">{meta}</p> : null}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-5 pt-3 pb-5">
        <Button className="flex-1 bg-green-600 text-white hover:bg-green-500" onClick={onApprove}>
          {approveLabel}
        </Button>
        <Button className="flex-1 bg-red-600 text-white hover:bg-red-500" onClick={onReject}>
          {rejectLabel}
        </Button>
      </div>
    </Card>
  );
}
