import { describe, it, expect } from "vitest";
import { toE164Ci, formatFcfa, formatPhoneCi } from "@/lib/utils";

describe("toE164Ci", () => {
  it("normalise un numéro à 10 chiffres (0 initial conservé)", () => {
    expect(toE164Ci("0700000001")).toBe("+2250700000001");
    expect(toE164Ci("07 00 00 00 01")).toBe("+2250700000001");
  });

  it("accepte un numéro déjà préfixé 225", () => {
    expect(toE164Ci("2250700000001")).toBe("+2250700000001");
    expect(toE164Ci("+225 07 00 00 00 01")).toBe("+2250700000001");
  });

  it("rejette un numéro de mauvaise longueur", () => {
    expect(toE164Ci("123")).toBeNull();
    expect(toE164Ci("070000000")).toBeNull(); // 9 chiffres
  });
});

describe("formatFcfa", () => {
  it("formate un montant avec séparateur de milliers", () => {
    expect(formatFcfa(1000)).toBe("1 000 FCFA");
    expect(formatFcfa(2000)).toBe("2 000 FCFA");
  });
});

describe("formatPhoneCi", () => {
  it("affiche un numéro E.164 CI groupé par 2", () => {
    expect(formatPhoneCi("+2250700000001")).toBe("+225 07 00 00 00 01");
  });

  it("accepte aussi le format sans « + » (stocké par GoTrue)", () => {
    expect(formatPhoneCi("2250700000003")).toBe("+225 07 00 00 00 03");
  });
});
