"use server";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Mémorise la langue choisie dans un cookie (1 an). Le rafraîchissement recharge les RSC. */
export async function setUserLocale(locale: Locale) {
  const value: Locale = isLocale(locale) ? locale : defaultLocale;
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
