import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

type BillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

const HEALTHY_BILLING_STATUSES = new Set<BillingStatus>(["active", "trialing"]);

function toTimestampFromUnix(seconds?: number | null): Timestamp | null {
  if (!seconds || Number.isNaN(seconds)) return null;
  return Timestamp.fromMillis(seconds * 1000);
}

function toId(expandable: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!expandable) return null;
  return typeof expandable === "string" ? expandable : expandable.id;
}

function toSubscriptionId(
  expandable: string | { id: string } | null | undefined
): string | null {
  if (!expandable) return null;
  return typeof expandable === "string" ? expandable : expandable.id;
}

function getCurrentPeriodEndSeconds(sub: Stripe.Subscription): number | null {
  const rootPeriodEnd = (sub as unknown as { current_period_end?: unknown }).current_period_end;
  if (typeof rootPeriodEnd === "number") return rootPeriodEnd;

  const firstItem = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: unknown })
    | undefined;

  if (firstItem && typeof firstItem.current_period_end === "number") {
    return firstItem.current_period_end;
  }

  return null;
}

async function findUsersByStripeRefs(customerId: string | null, subscriptionId: string | null) {
  const users = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

  if (customerId) {
    const byCustomer = await adminDb
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(20)
      .get();
    byCustomer.docs.forEach((docSnap) => users.set(docSnap.id, docSnap));
  }

  if (subscriptionId) {
    const bySubscription = await adminDb
      .collection("users")
      .where("stripeSubscriptionId", "==", subscriptionId)
      .limit(20)
      .get();
    bySubscription.docs.forEach((docSnap) => users.set(docSnap.id, docSnap));
  }

  return Array.from(users.values());
}

async function syncUserBillingState(params: {
  customerId: string | null;
  subscriptionId: string | null;
  status: BillingStatus;
  eventType: string;
  eventId: string;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
  lastInvoiceId?: string | null;
  lastInvoiceStatus?: string | null;
}) {
  const targetUsers = await findUsersByStripeRefs(params.customerId, params.subscriptionId);
  if (targetUsers.length === 0) return;

  const now = Timestamp.now();
  const isDelinquent = !HEALTHY_BILLING_STATUSES.has(params.status);

  await Promise.all(
    targetUsers.map((userSnap) =>
      userSnap.ref.set(
        {
          stripeCustomerId: params.customerId,
          stripeSubscriptionId: params.subscriptionId,
          billingStatus: params.status,
          billingDelinquent: isDelinquent,
          billingCurrentPeriodEnd: params.currentPeriodEnd,
          billingCancelAtPeriodEnd: params.cancelAtPeriodEnd,
          billingLastInvoiceId: params.lastInvoiceId ?? null,
          billingLastInvoiceStatus: params.lastInvoiceStatus ?? null,
          billingLastEventType: params.eventType,
          billingLastEventId: params.eventId,
          billingUpdatedAt: now,
        },
        { merge: true }
      )
    )
  );

  const churchRefs = new Map<string, FirebaseFirestore.DocumentReference>();

  for (const userSnap of targetUsers) {
    const uid = userSnap.id;

    const ownerChurches = await adminDb
      .collection("churches")
      .where("billingOwnerUid", "==", uid)
      .limit(50)
      .get();
    ownerChurches.docs.forEach((docSnap) => churchRefs.set(docSnap.id, docSnap.ref));

    const legacyOwnerChurches = await adminDb
      .collection("churches")
      .where("createdBy", "==", uid)
      .limit(50)
      .get();
    legacyOwnerChurches.docs.forEach((docSnap) => churchRefs.set(docSnap.id, docSnap.ref));

    const data = userSnap.data() as { email?: unknown };
    const billingContactEmail = typeof data.email === "string" ? data.email : null;

    await Promise.all(
      Array.from(churchRefs.values()).map((ref) =>
        ref.set(
          {
            billingOwnerUid: uid,
            billingContactEmail,
            stripeCustomerId: params.customerId,
            stripeSubscriptionId: params.subscriptionId,
            billingStatus: params.status,
            billingDelinquent: isDelinquent,
            billingCurrentPeriodEnd: params.currentPeriodEnd,
            billingCancelAtPeriodEnd: params.cancelAtPeriodEnd,
            billingLastInvoiceId: params.lastInvoiceId ?? null,
            billingLastInvoiceStatus: params.lastInvoiceStatus ?? null,
            billingLastEventType: params.eventType,
            billingLastEventId: params.eventId,
            billingUpdatedAt: now,
          },
          { merge: true }
        )
      )
    );

    churchRefs.clear();
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventRef = adminDb.collection("stripeWebhookEvents").doc(event.id);
  const existingEvent = await eventRef.get();
  if (existingEvent.exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = toId(session.customer as string | Stripe.Customer | null | undefined);
    const subscriptionId = toSubscriptionId(
      session.subscription as string | Stripe.Subscription | null | undefined
    );
    const planId = session.metadata?.planId;

    const token = randomUUID();

    await adminDb.collection("signupTokens").doc(token).set({
      planId: planId ?? null,
      customerId,
      subscriptionId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 1000 * 60 * 30),
      used: false,
      sourceEventId: event.id,
    });

    if (subscriptionId) {
      try {
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as Stripe.Subscription;
        const status = sub.status as BillingStatus;

        await syncUserBillingState({
          customerId: toId(sub.customer),
          subscriptionId: sub.id,
          status,
          eventType: event.type,
          eventId: event.id,
          currentPeriodEnd: toTimestampFromUnix(getCurrentPeriodEndSeconds(sub)),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          lastInvoiceId: toSubscriptionId(sub.latest_invoice as string | { id: string } | null | undefined),
          lastInvoiceStatus: null,
        });
      } catch (error) {
        console.error("Unable to sync billing state from checkout session:", error);
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const status = sub.status as BillingStatus;

    await syncUserBillingState({
      customerId: toId(sub.customer),
      subscriptionId: sub.id,
      status,
      eventType: event.type,
      eventId: event.id,
      currentPeriodEnd: toTimestampFromUnix(getCurrentPeriodEndSeconds(sub)),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      lastInvoiceId: typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id ?? null,
      lastInvoiceStatus: null,
    });
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = toSubscriptionId(
      (invoice as unknown as { subscription?: string | { id: string } | null }).subscription
    );

    if (subscriptionId) {
      try {
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as Stripe.Subscription;
        const status = sub.status as BillingStatus;

        await syncUserBillingState({
          customerId: toId(sub.customer),
          subscriptionId: sub.id,
          status,
          eventType: event.type,
          eventId: event.id,
          currentPeriodEnd: toTimestampFromUnix(getCurrentPeriodEndSeconds(sub)),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          lastInvoiceId: invoice.id,
          lastInvoiceStatus: invoice.status ?? null,
        });
      } catch (error) {
        console.error("Unable to sync billing state from invoice event:", error);
      }
    }
  }

  await eventRef.set({
    type: event.type,
    livemode: event.livemode,
    created: Timestamp.fromMillis(event.created * 1000),
    processedAt: Timestamp.now(),
  });

  return NextResponse.json({ received: true });
}
