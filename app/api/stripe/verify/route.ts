import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session and validate ownership.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    });

    const sessionUid = session.metadata?.uid ?? null;
    const authEmail = (authUser.email ?? "").trim().toLowerCase();
    const customerEmail =
      (session.customer_details?.email ??
        (typeof session.customer === "object" && session.customer && 'email' in session.customer
          ? (session.customer as { email: string | null }).email
          : null) ??
        "")
        .trim()
        .toLowerCase();

    const ownsByUid = sessionUid ? sessionUid === authUser.id : false;
    const ownsByEmail = !sessionUid && authEmail.length > 0 && customerEmail.length > 0 && authEmail === customerEmail;

    if (!ownsByUid && !ownsByEmail) {
      return NextResponse.json({ error: "Session does not belong to authenticated user" }, { status: 403 });
    }

    return NextResponse.json({
      status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
    });
  } catch (err: any) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json(
      { error: "Unable to verify session" },
      { status: 500 }
    );
  }
}
