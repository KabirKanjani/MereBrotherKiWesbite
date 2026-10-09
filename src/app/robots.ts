import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/cms";

/**
 * Read on demand. Without this Next tries to prerender robots.txt at build time,
 * which fails because there is no database running during a build, and the file
 * silently disappears from the output.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The CMS and its API are for staff only. There is nothing here for a
      // search engine to index, and blocking it keeps staff URLs out of results.
      disallow: ["/admin", "/admin/*", "/api/*", "/(payload)/*"],
    },
    sitemap: `${settings.url}/sitemap.xml`,
    host: settings.url,
  };
}