// app/(dashboard)/admin/subscription-audit/page.tsx
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";
import { adminDb } from "@/app/lib/firebase/admin";
import SubscriptionAuditClient from "./SubscriptionAuditClient";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export type AuditRecord = {
  uid: string;
  email: string;
  name: string;
  churchId: string | null;
  churchName: string | null;
  planId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  onboardingComplete: boolean;
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
    | "error";
};

export default async function SubscriptionAuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.roles ?? [], "system.manage")) {
    redirect(`/church/${user.churchId}/user`);
  }

  // Audit one record per church using church-level billing ownership.
  const churchesSnap = await adminDb.collection("churches").get();

  const churchOwners = churchesSnap.docs.map((doc) => {
    const data = doc.data() as {
      createdBy?: unknown;
      billingOwnerUid?: unknown;
      name?: unknown;
      planId?: unknown;
      stripeCustomerId?: unknown;
      stripeSubscriptionId?: unknown;
      billingStatus?: unknown;
      billingContactEmail?: unknown;
    };
    return {
      churchId: doc.id,
      churchName: typeof data.name === "string" ? data.name : null,
      ownerUid:
        typeof data.billingOwnerUid === "string"
          ? data.billingOwnerUid
          : typeof data.createdBy === "string"
          ? data.createdBy
          : null,
      churchPlanId: typeof data.planId === "string" ? data.planId : null,
      churchStripeCustomerId:
        typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : null,
      churchStripeSubscriptionId:
        typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId : null,
      churchBillingStatus:
        typeof data.billingStatus === "string" ? data.billingStatus : null,
      churchBillingContactEmail:
        typeof data.billingContactEmail === "string" ? data.billingContactEmail : null,
    };
  });

  const ownerUids = Array.from(
    new Set(churchOwners.map((c) => c.ownerUid).filter((uid): uid is string => Boolean(uid)))
  );

  const ownerRefs = ownerUids.map((uid) => adminDb.collection("users").doc(uid));
  const ownerSnaps = ownerRefs.length > 0 ? await adminDb.getAll(...ownerRefs) : [];

  const ownersByUid = new Map(
    ownerSnaps
      .filter((snap) => snap.exists)
      .map((snap) => [snap.id, snap.data() as Record<string, unknown>])
  );

  const records: AuditRecord[] = await Promise.all(
    churchOwners.map(async ({
      churchId,
      churchName,
      ownerUid,
      churchPlanId,
      churchStripeCustomerId,
      churchStripeSubscriptionId,
      churchBillingStatus,
      churchBillingContactEmail,
    }) => {
      const owner = ownerUid ? ownersByUid.get(ownerUid) : undefined;
      const subscriptionId =
        churchStripeSubscriptionId ??
        (owner && typeof owner.stripeSubscriptionId === "string"
          ? owner.stripeSubscriptionId
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

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionStatus = sub.status as AuditRecord["subscriptionStatus"];
        } catch {
          subscriptionStatus = "error";
        }
      }

      const firstName = owner && typeof owner.firstName === "string" ? owner.firstName : "";
      const lastName = owner && typeof owner.lastName === "string" ? owner.lastName : "";
      const email =
        churchBillingContactEmail ??
        (owner && typeof owner.email === "string" ? owner.email : "Unknown owner");
      const name = [firstName, lastName].filter(Boolean).join(" ") || email;

      return {
        uid: ownerUid ?? `missing-owner:${churchId}`,
        email,
        name,
        churchId,
        churchName,
        planId:
          churchPlanId ??
          (owner && typeof owner.planId === "string" ? owner.planId : null),
        stripeCustomerId:
          churchStripeCustomerId ??
          (owner && typeof owner.stripeCustomerId === "string"
            ? owner.stripeCustomerId
            : null),
        stripeSubscriptionId: subscriptionId,
        onboardingComplete: owner?.onboardingComplete === true,
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
