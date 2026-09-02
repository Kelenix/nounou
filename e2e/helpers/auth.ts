import { expect, type Page } from "@playwright/test";

export const STORAGE = {
  superAdmin: "e2e/.auth/super-admin.json",
  staff: "e2e/.auth/staff.json",
} as const;

export const DEMO_OTP = "123456";
export const PHONES = {
  superAdmin: "0700000001",
  employer: "0700000002",
  candidate: "0700000003",
} as const;

/**
 * Connexion via l'UI (téléphone + OTP de test).
 * Attend la redirection hors des pages d'auth avant de rendre la main.
 */
export async function login(page: Page, phone: string, otp: string = DEMO_OTP) {
  await page.goto("/connexion");
  await page.getByLabel("Numéro de téléphone").fill(phone);
  await page.getByRole("button", { name: "Recevoir le code" }).click();

  await expect(page.getByLabel("Code à 6 chiffres")).toBeVisible();
  await page.getByLabel("Code à 6 chiffres").fill(otp);
  await page.getByRole("button", { name: "Vérifier le code" }).click();

  await page.waitForURL((url) => !/\/(connexion|inscription)/.test(url.pathname), { timeout: 15_000 });
}
