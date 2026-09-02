import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "J'ai ma nounou — Trouvez la nounou idéale",
    template: "%s · J'ai ma nounou",
  },
  description:
    "Plateforme de mise en relation entre familles et aides à domicile en Côte d'Ivoire. Nounou, ménage, cuisine, garde d'enfants. La confiance avant tout.",
  applicationName: "J'ai ma nounou",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Nounou" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#2E9E1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
