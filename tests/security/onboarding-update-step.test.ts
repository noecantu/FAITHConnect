import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerUserMock,
  normalizePlanIdMock,
  fromMock,
  updateEqMock,
  updateMock,
} = vi.hoisted(() => ({
  getServerUserMock: vi.fn(),
  normalizePlanIdMock: vi.fn(),
  fromMock: vi.fn(),
  updateEqMock: vi.fn(),
  updateMock: vi.fn(),
}));

let currentUser: {
  onboarding_step: string;
  onboarding_complete: boolean;
  plan_id: string | null;
  billing_status: string | null;
  stripe_subscription_id: string | null;
};

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

import { POST } from "@/app/api/users/update-onboarding-step/route";

describe("/api/users/update-onboarding-step security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockImplementation(() => ({ eq: updateEqMock }));

    currentUser = {
      onboarding_step: "choose-plan",
      onboarding_complete: false,
      plan_id: null,
      billing_status: null,
      stripe_subscription_id: null,
    };

    getServerUserMock.mockResolvedValue({ id: "u_1", email: "owner@example.com" });
    normalizePlanIdMock.mockImplementation((v: unknown) =>
      typeof v === "string" ? v : null
    );

    updateEqMock.mockResolvedValue({ error: null });

    fromMock.mockImplementation((table: string) => {
      if (table !== "users") throw new Error(`Unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: "u_1", ...currentUser }, error: null }),
          }),
        }),
        update: updateMock,
      };
    });
  });

  it("rejects direct stripe/church identifier updates", async () => {
    const req = new Request("http://localhost/api/users/update-onboarding-step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stripeCustomerId: "cus_123" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid onboarding transitions", async () => {
    currentUser.onboarding_step = "choose-plan";

    const req = new Request("http://localhost/api/users/update-onboarding-step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboardingStep: "create-church" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows billing to create-church only when billing is healthy", async () => {
    currentUser.onboarding_step = "billing";
    currentUser.billing_status = "active";
    currentUser.stripe_subscription_id = "sub_123";

    const req = new Request("http://localhost/api/users/update-onboarding-step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboardingStep: "create-church" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_step: "create-church" })
    );
  });
});
