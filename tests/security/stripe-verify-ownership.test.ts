import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerUserMock, stripeRetrieveSessionMock } = vi.hoisted(() => ({
  getServerUserMock: vi.fn(),
  stripeRetrieveSessionMock: vi.fn(),
}));

vi.mock("@/app/lib/supabase/server", () => ({
  getServerUser: getServerUserMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { retrieve: stripeRetrieveSessionMock } };
  },
}));

import { GET } from "@/app/api/stripe/verify/route";

describe("/api/stripe/verify ownership checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getServerUserMock.mockResolvedValue({ id: "u_1", email: "owner@example.com" });
    stripeRetrieveSessionMock.mockResolvedValue({
      payment_status: "paid",
      customer: { id: "cus_1", email: "owner@example.com" },
      customer_details: { email: "owner@example.com" },
      subscription: "sub_1",
      metadata: { uid: "u_1" },
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getServerUserMock.mockResolvedValue(null);

    const req = new Request("http://localhost/api/stripe/verify?session_id=cs_1");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 403 when session ownership does not match", async () => {
    stripeRetrieveSessionMock.mockResolvedValue({
      payment_status: "paid",
      customer: { id: "cus_2", email: "other@example.com" },
      customer_details: { email: "other@example.com" },
      subscription: "sub_2",
      metadata: { uid: "u_other" },
    });

    const req = new Request("http://localhost/api/stripe/verify?session_id=cs_2");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("returns payment details for owned session", async () => {
    const req = new Request("http://localhost/api/stripe/verify?session_id=cs_3");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("paid");
    expect(body.subscription).toBe("sub_1");
  });
});
