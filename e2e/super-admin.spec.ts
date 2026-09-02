import { test, expect } from "@playwright/test";
import { adminDb, getSuperAdminId } from "./helpers/db";
import { STORAGE } from "./helpers/auth";

test.describe("Super Admin — accès complet", () => {
  test.use({ storageState: STORAGE.superAdmin });

  test("voit la gestion des admins et le journal d'audit", async ({ page }) => {
    await page.goto("/admin/administrateurs");
    await expect(page).toHaveURL(/\/admin\/administrateurs/);
    await expect(page.getByRole("heading", { name: "Administrateurs", exact: true })).toBeVisible();

    await page.goto("/admin/journal");
    await expect(page).toHaveURL(/\/admin\/journal/);
    await expect(page.getByRole("heading", { name: /Journal d'audit/ })).toBeVisible();
  });
});

test.describe("Membre du staff — accès restreint & protection backend", () => {
  test.use({ storageState: STORAGE.staff });

  test("ne voit pas le Super Admin dans la liste des utilisateurs", async ({ page }) => {
    await page.goto("/admin/utilisateurs");
    await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible();
    await expect(page.getByText("Super Admin", { exact: true })).toHaveCount(0);
  });

  test("les pages réservées au Super Admin le renvoient vers /admin", async ({ page }) => {
    await page.goto("/admin/administrateurs");
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/journal");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("l'API refuse toute action du staff sur le Super Admin (403)", async ({ page }) => {
    const superAdminId = await getSuperAdminId();

    for (const data of [
      { action: "delete", userId: superAdminId },
      { action: "set_role", userId: superAdminId, role: "candidate" },
      { action: "suspend", userId: superAdminId, suspended: true },
    ]) {
      const res = await page.request.post("/api/admin/users", { data });
      expect(res.status(), `action=${data.action}`).toBe(403);
    }

    // Le compte reste intact et Super Admin (protection base + API).
    const { data } = await adminDb()
      .from("profiles")
      .select("is_super_admin, is_suspended, role")
      .eq("id", superAdminId)
      .single();
    expect(data?.is_super_admin).toBe(true);
    expect(data?.is_suspended).toBe(false);
    expect(data?.role).toBe("admin");
  });
});
