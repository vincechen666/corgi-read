import { describe, expect, test } from "vitest";

import { authEmailFlowResponseSchema } from "@/features/auth/auth-flow-schema";

describe("authEmailFlowResponseSchema", () => {
  test("accepts signup-link and login-code flow responses", () => {
    expect(
      authEmailFlowResponseSchema.parse({ flow: "signup-link" }).flow,
    ).toBe("signup-link");

    expect(
      authEmailFlowResponseSchema.parse({ flow: "login-code" }).flow,
    ).toBe("login-code");
  });
});
