import { describe, it, expect } from "vitest";
import { isValidName, isValidCiPhone } from "@/lib/profile-validation";

describe("isValidName", () => {
  it("accepte de vrais noms (accents, tirets, apostrophes)", () => {
    for (const v of ["Aya", "Kouassi", "Jean-Pierre", "N'Guessan", "Éléonore", "Koffi Yao"]) {
      expect(isValidName(v)).toBe(true);
    }
  });

  it("refuse les noms factices et invalides", () => {
    for (const v of ["", "a", "Test", "test test", "TEST", "Sans nom", "idiot", "aaaa", "azerty", "Test1", "123"]) {
      expect(isValidName(v)).toBe(false);
    }
  });
});

describe("isValidCiPhone", () => {
  it("accepte 10 chiffres locaux et le format 225 + 10", () => {
    expect(isValidCiPhone("0700000001")).toBe(true);
    expect(isValidCiPhone("07 00 00 00 01")).toBe(true);
    expect(isValidCiPhone("2250700000001")).toBe(true);
  });

  it("refuse vide ou longueur invalide", () => {
    for (const v of ["", null, undefined, "070000", "12345678901"]) {
      expect(isValidCiPhone(v)).toBe(false);
    }
  });
});
