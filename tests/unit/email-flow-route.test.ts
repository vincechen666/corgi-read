import { beforeEach, describe, expect, test, vi } from "vitest";

const getEmailFlowMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/server/email-flow-service", () => ({
  getEmailFlow: getEmailFlowMock,
}));

import { POST } from "@/app/api/auth/email-flow/route";

describe("POST /api/auth/email-flow", () => {
  beforeEach(() => {
    getEmailFlowMock.mockReset();
  });

  test("returns a compact flow response for a valid email payload", async () => {
    getEmailFlowMock.mockResolvedValue("login-code");

    const response = await POST(
      new Request("http://localhost/api/auth/email-flow", {
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ flow: "login-code" });
    expect(getEmailFlowMock).toHaveBeenCalledWith("reader@example.com");
  });

  test("returns 400 for an invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/email-flow", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });
});
