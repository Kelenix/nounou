import { describe, it, expect } from "vitest";
import { phoneSchema, otpSchema } from "@/features/auth/schemas";

describe("phoneSchema", () => {
  it("accepte 10 chiffres avec ou sans espaces", () => {
    expect(phoneSchema.safeParse({ phone: "0700000001" }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: "07 00 00 00 01" }).success).toBe(true);
  });

  it("rejette une longueur incorrecte", () => {
    expect(phoneSchema.safeParse({ phone: "0700" }).success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepte exactement 6 chiffres", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(otpSchema.safeParse({ code: "abcdef" }).success).toBe(false);
  });
});
