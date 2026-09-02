import { test as teardown } from "@playwright/test";
import { adminDb } from "./helpers/db";

const STAFF_E164 = "2250700000006";

// Restaure l'état seedé du compte utilisé comme staff de test.
teardown("restaure le compte staff", async () => {
  await adminDb()
    .from("profiles")
    .update({ role: "candidate", is_super_admin: false, staff_permissions: [] })
    .eq("phone", STAFF_E164);
});
