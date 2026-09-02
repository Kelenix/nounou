import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "J'ai ma nounou",
    short_name: "Nounou",
    description:
      "Trouvez la nounou idéale ou un emploi d'aide à domicile en Côte d'Ivoire. La confiance avant tout.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F9FAFB",
    theme_color: "#2E9E1F",
    lang: "fr",
    dir: "ltr",
    categories: ["lifestyle", "social", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
