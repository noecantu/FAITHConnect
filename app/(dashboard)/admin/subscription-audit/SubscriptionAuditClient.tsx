"use client";

import Link from "next/link";
import { PageHeader } from "@/app/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import type { AuditRecord } from "./page";

const STATUS_CONFIG: Record<
  AuditRecord["subscriptionStatus"],
  { label: string; className: string }
> = {
  active:             { label: "Active",             className: "bg-emerald-500/15 text-emerald-200 border-emerald-300/30" },
  trialing:           { label: "Trialing",           className: "bg-sky-500/15 text-sky-200 border-sky-300/30" },
  past_due:           { label: "Past Due",           className: "bg-amber-500/15 text-amber-200 border-amber-300/30" },
  unpaid:             { label: "Unpaid",             className: "bg-rose-500/15 text-rose-200 border-rose-300/30" },
  canceled:           { label: "Canceled",           className: "bg-rose-500/15 text-rose-200 border-rose-300/30" },
  incomplete:         { label: "Incomplete",         className: "bg-orange-500/15 text-orange-200 border-orange-300/30" },
  incomplete_expired: { label: "Incomplete/Expired", className: "bg-rose-500/15 text-rose-200 border-rose-300/30" },
  paused:             { label: "Paused",             className: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
  no_subscription:    { label: "No Subscription",    className: "bg-rose-500/15 text-rose-200 border-rose-300/30" },
  error:              { label: "Lookup Error",       className: "bg-yellow-500/15 text-yellow-200 border-yellow-300/30" },
};

const PROBLEM_STATUSES: AuditRecord["subscriptionStatus"][] = [
  "no_subscription",
  "error",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
];

function StatusBadge({ status }: { status: AuditRecord["subscriptionStatus"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.error;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active" || status === "trialing"
            ? "bg-emerald-300"
            : status === "past_due" || status === "paused"
            ? "bg-amber-300"
            : "bg-rose-300"
        }`}
      />
      {cfg.label}
    </span>
  );
}

function fmtAmount(cents: number | null, interval: string | null): string {
  if (cents === null) return "—";
  const dollars = (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return interval ? `${dollars}/${interval}` : dollars;
}

function fmtDate(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isWithin7Days(unix: number | null): boolean {
  if (!unix) return false;
  const diff = unix * 1000 - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export default function SubscriptionAuditClient({
  records,
}: {
  records: AuditRecord[];
}) {
  const problemCount = records.filter((r) =>
    PROBLEM_STATUSES.includes(r.subscriptionStatus)
  ).length;

  const activeCount = records.filter(
    (r) => r.subscriptionStatus === "active" || r.subscriptionStatus === "trialing"
  ).length;

  return (
    <>
      <PageHeader
        title="Subscription Audit"
        subtitle="Verify each church billing owner has a valid active subscription (falls back to original owner for legacy records)."
      />

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Churches Audited</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{records.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active / Trialing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
          </CardContent>
        </Card>

        <Card className={problemCount > 0 ? "border-rose-500/40" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Flagged / Issues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${problemCount > 0 ? "text-rose-400" : "text-muted-foreground"}`}>
              {problemCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Renewing Within 7 Days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-400">
              {records.filter((r) => isWithin7Days(r.currentPeriodEnd)).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Canceling at Period End</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${records.filter((r) => r.cancelAtPeriodEnd).length > 0 ? "text-rose-400" : "text-muted-foreground"}`}>
              {records.filter((r) => r.cancelAtPeriodEnd).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Church Owner Subscription Status</CardTitle>
          <CardDescription>
            Live subscription data pulled from Stripe. Rows in red need attention.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Church</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Renews / Ends</th>
                  <th className="px-4 py-3 font-medium">Trial Ends</th>
                  <th className="px-4 py-3 font-medium">Subscription ID</th>
                  <th className="px-4 py-3 font-medium">Onboarding</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isProblem = PROBLEM_STATUSES.includes(r.subscriptionStatus);
                  return (
                    <tr
                      key={`${r.church_id ?? "no-church"}:${r.uid}`}
                      className={`border-b border-white/5 transition hover:bg-white/[0.03] ${
                        isProblem ? "bg-rose-500/[0.04]" : ""
                      }`}
                    >
                      {/* Admin */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-white/90">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>

                      {/* Church */}
                      <td className="px-4 py-3">
                        {r.church_id ? (
                          <Link
                            href={`/admin/churches/${r.church_id}`}
                            className="text-blue-400 hover:underline"
                          >
                            {r.churchName ?? r.church_id}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">No church</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3 text-white/70 capitalize">
                        {r.plan_id ?? <span className="text-muted-foreground italic">—</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-white/70 text-xs whitespace-nowrap">
                        {fmtAmount(r.amountCents, r.interval)}
                      </td>

                      {/* Current period end */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {r.currentPeriodEnd ? (
                          <span className={isWithin7Days(r.currentPeriodEnd) ? "text-amber-400 font-medium" : "text-white/60"}>
                            {fmtDate(r.currentPeriodEnd)}
                            {r.cancelAtPeriodEnd && (
                              <span className="ml-1 text-rose-400">(cancels)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Trial end */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {r.trialEnd ? (
                          <span className="text-sky-400">{fmtDate(r.trialEnd)}</span>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Subscription ID */}
                      <td className="px-4 py-3">
                        {r.stripeSubscriptionId ? (
                          <span className="font-mono text-xs text-white/60">
                            {r.stripeSubscriptionId.slice(0, 14)}…
                          </span>
                        ) : (
                          <span className="text-rose-400 italic text-xs">None</span>
                        )}
                      </td>

                      {/* Onboarding */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            r.onboardingComplete ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {r.onboardingComplete ? "Complete" : "In Progress"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={r.subscriptionStatus} />
                      </td>
                    </tr>
                  );
                })}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No church owners found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
