import type { MetadataRoute } from "next";
import { getProducts, getSettings } from "@/lib/cms";

/** Read on demand so a newly published style is discoverable straight away. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/collection", priority: 0.9, changeFrequency: "weekly" },
    { path: "/craft", priority: 0.7, changeFrequency: "monthly" },
    { path: "/bulk", priority: 0.8, changeFrequency: "monthly" },
    { path: "/size-guide", priority: 0.6, changeFrequency: "monthly" },
    { path: "/visit", priority: 0.6, changeFrequency: "monthly" },
    { path: "/enquiry", priority: 0.8, changeFrequency: "monthly" },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${settings.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...products.map((p) => ({
      url: `${settings.url}/collection/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}