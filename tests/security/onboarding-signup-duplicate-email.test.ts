import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUserMock,
  upsertMock,
  fromMock,
  isMissingTableErrorMock,
  schemaNotInitializedResponseMock,
} = vi.hoisted(() => ({
  createUserMock: vi.fn(),
  upsertMock: vi.fn(),
  fromMock: vi.fn(),
  isMissingTableErrorMock: vi.fn(),
  schemaNotInitializedResponseMock: vi.fn(),
}));

vi.mock("@/app/lib/supabase/admin", () => ({
  getAdminClient: () => ({
    auth: {
      admin: {
        createUser: createUserMock,
      },
    },
  }),
  adminDb: {
    from: fromMock,
  },
}));

vi.mock("@/app/lib/supabase/schema-errors", () => ({
  isMissingTableError: isMissingTableErrorMock,
  schemaNotInitializedResponse: schemaNotInitializedResponseMock,
}));

import { POST } from "@/app/api/onboarding/signup/route";

describe("/api/onboarding/signup duplicate-email behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isMissingTableErrorMock.mockReturnValue(false);
    schemaNotInitializedResponseMock.mockImplementation((table: string) => ({
      error: `Schema not initialized: ${table}`,
      code: "SCHEMA_NOT_INITIALIZED",
    }));

    upsertMock.mockResolvedValue({ error: null });

    fromMock.mockImplementation((table: string) => {
      if (table !== "users") throw new Error(`Unexpected table ${table}`);
      return {
        upsert: upsertMock,
      };
    });
  });

  it("returns 409 for duplicate email and does not upsert profile", async () => {
    createUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const req = new Request("http://localhost/api/onboarding/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "existing@example.com",
        password: "Password123!",
        firstName: "Existing",
        lastName: "User",
        plan: "beginning",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.alreadyExists).toBe(true);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("creates profile for new signup with billing onboarding defaults", async () => {
    createUserMock.mockResolvedValue({
      data: { user: { id: "uid_new_1" } },
      error: null,
    });

    const req = new Request("http://localhost/api/onboarding/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new@example.com",
        password: "Password123!",
        firstName: "New",
        lastName: "Owner",
        plan: "beginning",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uid_new_1",
        onboarding_step: "billing",
        onboarding_complete: false,
        roles: ["Admin"],
        plan_id: "beginning",
      }),
      { onConflict: "id" }
    );
  });
});
