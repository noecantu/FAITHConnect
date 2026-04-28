// app/(dashboard)/admin/subscription-audit/page.tsx
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";
import { adminDb } from "@/app/lib/supabase/admin";
import SubscriptionAuditClient from "./SubscriptionAuditClient";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export type AuditRecord = {
  uid: string;
  email: string;
  name: string;
  church_id: string | null;
  churchName: string | null;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripeSubscriptionId: string | null;
  onboardingComplete: boolean;
  /** Monthly/annual amount in cents */
  amountCents: number | null;
  /** Billing interval: "month" | "year" etc. */
  interval: string | null;
  /** Current period end (Unix timestamp) */
  currentPeriodEnd: number | null;
  /** Trial end (Unix timestamp), null if not trialing */
  trialEnd: number | null;
  /** Whether subscription cancels at period end */
  cancelAtPeriodEnd: boolean;
  /** True when this church was created by the Root Admin (no Stripe subscription required) */
  isRootAdminChurch: boolean;
  subscriptionStatus:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "paused"
    | "no_subscription"
    | "root_admin"
    | "error";
};

export default async function SubscriptionAuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.roles ?? [], "system.manage")) {
    redirect(`/church/${user.church_id}/user`);
  }

  // Audit one record per church using church-level billing ownership.
  const { data: churchRows } = await adminDb.from("churches").select(
    "id, name, billing_owner_uid, created_by, plan_id, stripe_customer_id, stripe_subscription_id, billing_status, billing_contact_email"
  );

  const churchOwners = (churchRows ?? []).map((row) => ({
    church_id: row.id,
    churchName: typeof row.name === "string" ? row.name : null,
    billingOwnerUid: typeof row.billing_owner_uid === "string" ? row.billing_owner_uid : null,
    createdByUid: typeof row.created_by === "string" ? row.created_by : null,
    ownerUid: typeof row.billing_owner_uid === "string"
      ? row.billing_owner_uid
      : typeof row.created_by === "string"
      ? row.created_by
      : null,
    churchPlanId: typeof row.plan_id === "string" ? row.plan_id : null,
    churchStripeCustomerId: typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : null,
    churchStripeSubscriptionId: typeof row.stripe_subscription_id === "string" ? row.stripe_subscription_id : null,
    churchBillingStatus: typeof row.billing_status === "string" ? row.billing_status : null,
    churchBillingContactEmail: typeof row.billing_contact_email === "string" ? row.billing_contact_email : null,
  }));

  const ownerUids = Array.from(
    new Set(churchOwners.map((c) => c.ownerUid).filter((uid): uid is string => Boolean(uid)))
  );

  // Also collect all created_by UIDs so we can check their roles for Root Admin detection
  const creatorUids = Array.from(
    new Set(churchOwners.map((c) => c.createdByUid).filter((uid): uid is string => Boolean(uid)))
  );
  const allRelevantUids = Array.from(new Set([...ownerUids, ...creatorUids]));

  const rootAdminEmail = (process.env.ROOT_ADMIN_EMAIL ?? "root@faithconnect.app").toLowerCase();

  const { data: ownerRows } = allRelevantUids.length > 0
    ? await adminDb.from("users").select("id, email, first_name, last_name, plan_id, stripe_customer_id, stripe_subscription_id, onboarding_complete, roles").in("id", allRelevantUids)
    : { data: [] };

  const ownersByUid = new Map(
    (ownerRows ?? []).map((u) => [u.id, u as Record<string, unknown>])
  );

  /** Returns true if a uid belongs to a Root/System Admin user */
  function isRootAdminUid(uid: string | null): boolean {
    if (!uid) return false;
    const u = ownersByUid.get(uid);
    if (!u) return false;
    const roles: string[] = Array.isArray(u.roles) ? u.roles as string[] : [];
    if (roles.includes("RootAdmin") || roles.includes("SystemAdmin")) return true;
    // Fallback: email matches ROOT_ADMIN_EMAIL
    return typeof u.email === "string" && u.email.toLowerCase() === rootAdminEmail;
  }

  const records: AuditRecord[] = await Promise.all(
    churchOwners.map(async ({
      church_id,
      churchName,
      billingOwnerUid,
      createdByUid,
      ownerUid,
      churchPlanId,
      churchStripeCustomerId,
      churchStripeSubscriptionId,
      churchBillingStatus,
      churchBillingContactEmail,
    }) => {
      const owner = ownerUid ? ownersByUid.get(ownerUid) : undefined;
      // A church is a "Root Admin church" when it was created by a RootAdmin/SystemAdmin
      // AND has no Stripe subscription — regardless of whether billing ownership was later reassigned
      const isRootAdminChurch = isRootAdminUid(createdByUid) && !churchStripeSubscriptionId;

      const subscriptionId =
        churchStripeSubscriptionId ??
        (owner && typeof owner.stripe_subscription_id === "string"
          ? owner.stripe_subscription_id
          : null);

      let subscriptionStatus: AuditRecord["subscriptionStatus"] =
        churchBillingStatus === "active" ||
        churchBillingStatus === "trialing" ||
        churchBillingStatus === "past_due" ||
        churchBillingStatus === "canceled" ||
        churchBillingStatus === "unpaid" ||
        churchBillingStatus === "incomplete" ||
        churchBillingStatus === "incomplete_expired" ||
        churchBillingStatus === "paused"
          ? (churchBillingStatus as AuditRecord["subscriptionStatus"])
          : "no_subscription";

      let amountCents: number | null = null;
      let interval: string | null = null;
      let currentPeriodEnd: number | null = null;
      let trialEnd: number | null = null;
      let cancelAtPeriodEnd = false;

      // Root Admin churches bypass Stripe billing entirely
      if (isRootAdminChurch) {
        subscriptionStatus = "root_admin";
      } else if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          }) as unknown as Stripe.Subscription & {
            current_period_end: number;
            trial_end: number | null;
            cancel_at_period_end: boolean;
          };
          subscriptionStatus = sub.status as AuditRecord["subscriptionStatus"];
          currentPeriodEnd = sub.current_period_end ?? null;
          trialEnd = sub.trial_end ?? null;
          cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
          const firstItem = sub.items?.data?.[0];
          if (firstItem?.price) {
            amountCents = firstItem.price.unit_amount ?? null;
            interval = firstItem.price.recurring?.interval ?? null;
          }
        } catch {
          subscriptionStatus = "error";
        }
      } else if (!isRootAdminChurch) {
        // subscriptionStatus already set above (no_subscription)
      }

      const first_name = owner && typeof owner.first_name === "string" ? owner.first_name : "";
      const last_name = owner && typeof owner.last_name === "string" ? owner.last_name : "";
      const email =
        churchBillingContactEmail ??
        (owner && typeof owner.email === "string" ? owner.email : "Unknown owner");
      const name = [first_name, last_name].filter(Boolean).join(" ") || email;

      return {
        uid: ownerUid ?? `missing-owner:${church_id}`,
        email,
        name,
        church_id,
        churchName,
        isRootAdminChurch,
        plan_id:
          churchPlanId ??
          (owner && typeof owner.plan_id === "string" ? owner.plan_id : null),
        stripe_customer_id:
          churchStripeCustomerId ??
          (owner && typeof owner.stripe_customer_id === "string"
            ? owner.stripe_customer_id
            : null),
        stripeSubscriptionId: subscriptionId,
        onboardingComplete: owner?.onboarding_complete === true,
        amountCents,
        interval,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd,
        subscriptionStatus,
      };
    })
  );

  // Sort: problems first (no_subscription, error, past_due, canceled), then active
  const order: Record<string, number> = {
    no_subscription: 0,
    error: 1,
    past_due: 2,
    canceled: 3,
    unpaid: 4,
    incomplete: 5,
    incomplete_expired: 6,
    paused: 7,
    trialing: 8,
    active: 9,
  };

  records.sort((a, b) => (order[a.subscriptionStatus] ?? 99) - (order[b.subscriptionStatus] ?? 99));

  return <SubscriptionAuditClient records={records} />;
}
