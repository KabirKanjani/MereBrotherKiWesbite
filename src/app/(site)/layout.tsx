import type { Metadata } from "next";
import { Fraunces, Jost } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import WhatsAppFab from "@/components/whatsapp-fab";
import { getSettings } from "@/lib/cms";
import { logoSrc } from "@/lib/logo";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/**
 * Shop details come from the CMS so staff can correct the phone number or store
 * address without a deploy. If the database cannot be reached, the fallback in
 * cms.ts keeps the page rendering rather than throwing.
 *
 * The header and footer are server components that read the same settings, so
 * they are rendered here rather than in the body, keeping the values consistent
 * across the whole page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    metadataBase: new URL(settings.url),
    title: {
      default: `${settings.name} | Kurti Manufacturer in ${settings.city}`,
      template: `%s | ${settings.name}`,
    },
    description: settings.description,
    keywords: [
      "kurti manufacturer Ahmedabad",
      "wholesale kurtis",
      "cotton kurti",
      "rayon kurti",
      "chanderi kurti set",
      "kurti pant set",
      "co-ord set",
      "bulk kurti orders India",
      settings.name,
    ],
    openGraph: {
      type: "website",
      locale: settings.locale,
      siteName: settings.name,
      title: `${settings.name} | Kurti Manufacturer in ${settings.city}`,
      description: settings.description,
      url: settings.url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.name} | Kurti Manufacturer in ${settings.city}`,
      description: settings.description,
    },
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    ...(logoSrc ? { icons: { icon: logoSrc, apple: logoSrc } } : {}),
  };
}

/**
 * The storefront's root layout.
 *
 * Next.js allows exactly one root layout per route group, and the admin has its
 * own because Payload renders its own <html> and <body>. The top-level
 * app/layout.tsx was removed for that reason: with it in place, both <html> tags
 * nested inside each other and the admin showed "This page couldn't load".
 *
 * The children type is spelled out rather than using the generated LayoutProps,
 * which is tied to whichever layout sits at the top level.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:bg-ink focus:px-4 focus:py-2 focus:text-linen"
        >
          Skip to content
        </a>
        <SiteHeader settings={settings} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
        <WhatsAppFab settings={settings} />
      </body>
    </html>
  );
}