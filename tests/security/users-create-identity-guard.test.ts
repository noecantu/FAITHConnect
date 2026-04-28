import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerUserMock, getUserByTokenMock, fromMock } = vi.hoisted(() => ({
  getServerUserMock: vi.fn(),
  getUserByTokenMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/app/lib/supabase/server", () => ({
  getServerUser: getServerUserMock,
}));

vi.mock("@/app/lib/supabase/admin", () => ({
  adminDb: {
    from: fromMock,
  },
  getAdminClient: () => ({
    auth: {
      getUser: getUserByTokenMock,
    },
  }),
}));

import { POST } from "@/app/api/users/create/route";

describe("/api/users/create fallback identity constraints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getServerUserMock.mockResolvedValue({ id: "u_session", email: "session@example.com" });

    fromMock.mockImplementation((table: string) => {
      if (table === "signup_tokens") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { message: "not found" } }),
            }),
          }),
        };
      }

      if (table === "users") {
        return {
          upsert: async () => ({ error: null }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("rejects fallback when uid does not match session user", async () => {
    const req = new Request("http://localhost/api/users/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        uid: "u_other",
        email: "session@example.com",
        token: "invalid_token",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("rejects fallback when email does not match session user", async () => {
    const req = new Request("http://localhost/api/users/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        uid: "u_session",
        email: "other@example.com",
        token: "invalid_token",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});
