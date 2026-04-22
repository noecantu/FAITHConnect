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

  // Fetch all church admins (role = "Admin")
  const snap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Admin")
    .limit(200)
    .get();

  const records: AuditRecord[] = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const subscriptionId: string | null = data.stripeSubscriptionId ?? null;

      let subscriptionStatus: AuditRecord["subscriptionStatus"] = "no_subscription";

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionStatus = sub.status as AuditRecord["subscriptionStatus"];
        } catch {
          subscriptionStatus = "error";
        }
      }

      const firstName = data.firstName ?? "";
      const lastName = data.lastName ?? "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || data.email;

      return {
        uid: doc.id,
        email: data.email ?? "",
        name,
        churchId: data.churchId ?? null,
        planId: data.planId ?? null,
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: subscriptionId,
        onboardingComplete: data.onboardingComplete === true,
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
