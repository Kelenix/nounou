import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces privés / techniques non indexables.
        disallow: ["/app/", "/admin/", "/api/", "/auth/", "/onboarding", "/connexion", "/inscription"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
