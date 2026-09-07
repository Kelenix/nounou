import { describe, it, expect } from "vitest";
import { phoneSchema, emailSchema, passwordSchema } from "@/features/auth/schemas";

describe("phoneSchema", () => {
  it("accepte 10 chiffres avec ou sans espaces", () => {
    expect(phoneSchema.safeParse({ phone: "0700000001" }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: "07 00 00 00 01" }).success).toBe(true);
  });

  it("rejette une longueur incorrecte", () => {
    expect(phoneSchema.safeParse({ phone: "0700" }).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepte un email valide et normalise en minuscules", () => {
    const parsed = emailSchema.safeParse({ email: "Contact@Exemple.CI" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("contact@exemple.ci");
  });

  it("rejette un email invalide", () => {
    expect(emailSchema.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("exige au moins 8 caractères", () => {
    expect(passwordSchema.safeParse({ password: "12345678" }).success).toBe(true);
    expect(passwordSchema.safeParse({ password: "court" }).success).toBe(false);
  });
});
