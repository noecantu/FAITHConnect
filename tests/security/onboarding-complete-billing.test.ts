import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerUserMock,
  normalizePlanIdMock,
  fromMock,
  stripeRetrieveSessionMock,
  stripeRetrieveSubscriptionMock,
  usersUpdateEqMock,
  usersUpdateMock,
} = vi.hoisted(() => ({
  getServerUserMock: vi.fn(),
  normalizePlanIdMock: vi.fn(),
  fromMock: vi.fn(),
  stripeRetrieveSessionMock: vi.fn(),
  stripeRetrieveSubscriptionMock: vi.fn(),
  usersUpdateEqMock: vi.fn(),
  usersUpdateMock: vi.fn(),
}));

vi.mock("@/app/lib/supabase/server", () => ({
  getServerUser: getServerUserMock,
}));

vi.mock("@/app/lib/pricing-plans", () => ({
  normalizePlanId: normalizePlanIdMock,
}));

vi.mock("@/app/lib/supabase/admin", () => ({
  adminDb: {
    from: fromMock,
  },
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { retrieve: stripeRetrieveSessionMock } };
    subscriptions = { retrieve: stripeRetrieveSubscriptionMock };
  },
}));

import { POST } from "@/app/api/onboarding/complete-billing/route";

describe("/api/onboarding/complete-billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersUpdateMock.mockImplementation(() => ({ eq: usersUpdateEqMock }));

    getServerUserMock.mockResolvedValue({ id: "u_1", email: "owner@example.com" });
    normalizePlanIdMock.mockImplementation((v: unknown) =>
      typeof v === "string" ? v : null
    );

    stripeRetrieveSessionMock.mockResolvedValue({
      payment_status: "paid",
      subscription: "sub_123",
      customer: { id: "cus_123", email: "owner@example.com" },
      customer_details: { email: "owner@example.com" },
      metadata: { uid: "u_1", plan_id: "beginning" },
    });

    stripeRetrieveSubscriptionMock.mockResolvedValue({ status: "active" });

    usersUpdateEqMock.mockResolvedValue({ error: null });

    fromMock.mockImplementation((table: string) => {
      if (table !== "users") throw new Error(`Unexpected table ${table}`);
      return {
        update: usersUpdateMock,
      };
    });
  });

  it("returns 401 when unauthenticated", async () => {
    getServerUserMock.mockResolvedValue(null);

    const req = new Request("http://localhost/api/onboarding/complete-billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_1" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(usersUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects sessions owned by another user", async () => {
    stripeRetrieveSessionMock.mockResolvedValue({
      payment_status: "paid",
      subscription: "sub_123",
      customer: { id: "cus_123", email: "other@example.com" },
      customer_details: { email: "other@example.com" },
      metadata: { uid: "u_other" },
    });

    const req = new Request("http://localhost/api/onboarding/complete-billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_2" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(usersUpdateMock).not.toHaveBeenCalled();
  });

  it("updates onboarding to create-church for valid owned paid session", async () => {
    const req = new Request("http://localhost/api/onboarding/complete-billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_3", planId: "beginning" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(usersUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_step: "create-church",
        onboarding_complete: false,
        stripe_subscription_id: "sub_123",
      })
    );
  });
});
