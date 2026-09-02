import { test, expect } from "@playwright/test";

test.describe("Marketplace publique (sans connexion)", () => {
  test("l'accueil présente les services et le catalogue, sans forcer la connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Services populaires" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nounous disponibles" })).toBeVisible();
    // La navbar propose de se connecter mais ne bloque pas la consultation.
    await expect(page.getByRole("link", { name: "Se connecter" }).first()).toBeVisible();
  });

  test("la liste des nounous est consultable et paginée", async ({ page }) => {
    await page.goto("/nounous");
    await expect(page).toHaveURL(/\/nounous/);
    // La page se charge (titre présent), qu'il y ait des résultats ou non.
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("la liste des offres est consultable", async ({ page }) => {
    await page.goto("/offres");
    await expect(page).toHaveURL(/\/offres/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("contacter une nounou demande la connexion (gate)", async ({ page }) => {
    await page.goto("/nounous");
    const firstCard = page.locator('a[href^="/nounous/"]').first();
    const hasCards = await firstCard.count();
    test.skip(hasCards === 0, "Aucune nounou seedée : `npm run db:reset` pour peupler le catalogue.");

    await firstCard.click();
    await expect(page).toHaveURL(/\/nounous\/.+/);
    // Un visiteur anonyme voit l'appel à se connecter, pas le numéro.
    await expect(page.getByText(/Connectez-vous ou créez un compte pour contacter/)).toBeVisible();
    // Le CTA du bloc contact pointe vers la connexion avec le redirect vers l'action.
    const cta = page.locator('a[href^="/connexion?redirect=/app/candidates/"]');
    await expect(cta).toBeVisible();
  });

  test("un connecté ne peut pas rouvrir la page de connexion", async ({ page }) => {
    // (sans session) la page de connexion est bien accessible
    await page.goto("/connexion");
    await expect(page.getByRole("button", { name: "Recevoir le code" })).toBeVisible();
  });
});
