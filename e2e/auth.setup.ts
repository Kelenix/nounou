import { test as setup } from "@playwright/test";
import { login, PHONES, STORAGE } from "./helpers/auth";
import { adminDb } from "./helpers/db";

const STAFF_E164 = "2250700000006";

// S'authentifie une seule fois par rôle et sauvegarde la session (limite les envois OTP).
setup("session Super Admin", async ({ page }) => {
  await login(page, PHONES.superAdmin);
  await page.context().storageState({ path: STORAGE.superAdmin });
});

setup("promotion + session staff", async ({ page }) => {
  // Promeut un compte seedé en membre du staff (permission « users »).
  await adminDb()
    .from("profiles")
    .update({ role: "admin", is_super_admin: false, staff_permissions: ["users"] })
    .eq("phone", STAFF_E164);
  await login(page, "0700000006");
  await page.context().storageState({ path: STORAGE.staff });
});
