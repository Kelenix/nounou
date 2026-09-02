import { test, expect } from "@playwright/test";
import { login, PHONES } from "./helpers/auth";

// Ces tests exercent le flux de login réel (un seul envoi OTP par test).
test.describe("Authentification par rôle (OTP de test)", () => {
  test("le Super Admin atterrit directement sur le back-office", async ({ page }) => {
    await login(page, PHONES.superAdmin);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText("Super Admin").first()).toBeVisible();
  });

  test("un employeur atterrit dans /app et ne peut pas rouvrir /connexion", async ({ page }) => {
    await login(page, PHONES.employer);
    await expect(page).toHaveURL(/\/app/);

    // Déjà connecté : la page de connexion le renvoie vers son espace.
    await page.goto("/connexion");
    await expect(page).not.toHaveURL(/\/connexion/);
  });
});
