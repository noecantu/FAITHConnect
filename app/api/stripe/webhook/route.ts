import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/supabase/admin";
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

function toISODate(seconds?: number | null): string | null {
  if (!seconds || Number.isNaN(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
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
  const rootPeriodEnd = (sub as any).current_period_end;
  if (typeof rootPeriodEnd === "number") return rootPeriodEnd;

  const firstItem = sub.items?.data?.[0];
  if (firstItem && typeof (firstItem as any).current_period_end === "number") {
    return (firstItem as any).current_period_end;
  }

  return null;
}

async function findUsersByStripeRefs(customerId: string | null, subscriptionId: string | null) {
  const users = new Map<string, any>();

  if (customerId) {
    const { data: byCustomer } = await adminDb
      .from("users")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .limit(20);
    
    byCustomer?.forEach((user) => users.set(user.id, user));
  }

  if (subscriptionId) {
    const { data: bySubscription } = await adminDb
      .from("users")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .limit(20);
    
    bySubscription?.forEach((user) => users.set(user.id, user));
  }

  return Array.from(users.values());
}

async function syncUserBillingState(params: {
  customerId: string | null;
  subscriptionId: string | null;
  status: BillingStatus;
  eventType: string;
  eventId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lastInvoiceId?: string | null;
  lastInvoiceStatus?: string | null;
}) {
  const targetUsers = await findUsersByStripeRefs(params.customerId, params.subscriptionId);
  if (targetUsers.length === 0) return;

  const now = new Date().toISOString();
  const isDelinquent = !HEALTHY_BILLING_STATUSES.has(params.status);

  await Promise.all(
    targetUsers.map(async (user) => {
      await adminDb
        .from("users")
        .update({
          stripe_customer_id: params.customerId,
          stripe_subscription_id: params.subscriptionId,
          billing_status: params.status,
          billing_delinquent: isDelinquent,
          billing_current_period_end: params.currentPeriodEnd,
          billing_cancel_at_period_end: params.cancelAtPeriodEnd,
          billing_last_invoice_id: params.lastInvoiceId ?? null,
          billing_last_invoice_status: params.lastInvoiceStatus ?? null,
          billing_last_event_type: params.eventType,
          billing_last_event_id: params.eventId,
          billing_updated_at: now,
        })
        .eq("id", user.id);

      const uid = user.id;

      // Find churches where this user is the billing owner or creator
      const { data: ownerChurches } = await adminDb
        .from("churches")
        .select("id")
        .or(`billing_owner_uid.eq.${uid},created_by.eq.${uid}`)
        .limit(50);

      if (ownerChurches && ownerChurches.length > 0) {
        const churchIds = ownerChurches.map(c => c.id);
        const billingContactEmail = user.email || null;

        await adminDb
          .from("churches")
          .update({
            billing_owner_uid: uid,
            billing_contact_email: billingContactEmail,
            stripe_customer_id: params.customerId,
            stripe_subscription_id: params.subscriptionId,
            billing_status: params.status,
            billing_delinquent: isDelinquent,
            billing_current_period_end: params.currentPeriodEnd,
            billing_cancel_at_period_end: params.cancelAtPeriodEnd,
            billing_last_invoice_id: params.lastInvoiceId ?? null,
            billing_last_invoice_status: params.lastInvoiceStatus ?? null,
            billing_last_event_type: params.eventType,
            billing_last_event_id: params.eventId,
            billing_updated_at: now,
          })
          .in("id", churchIds);
      }
    })
  );
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

  // Check if event already processed
  const { data: existingEvent } = await adminDb
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existingEvent) {
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

    await adminDb.from("signup_tokens").insert({
      id: token,
      plan_id: planId ?? null,
      customer_id: customerId,
      subscription_id: subscriptionId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      used: false,
      source_event_id: event.id,
    });

    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const status = sub.status as BillingStatus;

        await syncUserBillingState({
          customerId: toId(sub.customer),
          subscriptionId: sub.id,
          status,
          eventType: event.type,
          eventId: event.id,
          currentPeriodEnd: toISODate(getCurrentPeriodEndSeconds(sub)),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          lastInvoiceId: toSubscriptionId(sub.latest_invoice as any),
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
      currentPeriodEnd: toISODate(getCurrentPeriodEndSeconds(sub)),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      lastInvoiceId: typeof sub.latest_invoice === "string" ? sub.latest_invoice : (sub.latest_invoice as any)?.id ?? null,
      lastInvoiceStatus: null,
    });
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = toSubscriptionId(invoice.subscription as any);

    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const status = sub.status as BillingStatus;

        await syncUserBillingState({
          customerId: toId(sub.customer),
          subscriptionId: sub.id,
          status,
          eventType: event.type,
          eventId: event.id,
          currentPeriodEnd: toISODate(getCurrentPeriodEndSeconds(sub)),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          lastInvoiceId: invoice.id,
          lastInvoiceStatus: invoice.status ?? null,
        });
      } catch (error) {
        console.error("Unable to sync billing state from invoice event:", error);
      }
    }
  }

  await adminDb.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    created_at: new Date(event.created * 1000).toISOString(),
    processed_at: new Date().toISOString(),
  });

  return NextResponse.json({ received: true });
}
