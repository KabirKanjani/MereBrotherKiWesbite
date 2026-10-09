import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { products as catalogProducts } from "@/lib/catalog";

/**
 * The storefront's view of CMS content.
 *
 * Content is read straight from the database rather than through the site's own
 * /api routes. Going out to HTTP would mean a second round trip to the same
 * server, and it would break at build time, when there is no server listening.
 */

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  fabric: string | null;
  occasions: string[];
  sizes: string[];
  shortNote: string;
  colors: { name: string; hex: string }[];
  length: string;
  work: string;
  details: string[];
  care: string[];
  /** Absolute URL, or null when a style has no photograph yet. */
  image: string | null;
  alt: string;
  instagramUrl: string;
  instagramCode: string;
featured: boolean;
  isNew: boolean;
  sortOrder: number;
  rateCardPrice: number | null;
  /** Slug of the season this style belongs to, or null. */
  seasonSlug: string | null;
  seasonTitle: string | null;
};

export type OpeningHours = { days: string; time: string };

export type Settings = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  locale: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  instagramUrl: string;
  city: string;
  region: string;
  country: string;
  addressLines: string[];
  mapQuery: string;
  hours: OpeningHours[];
  minimumOrderQuantity: number;
  announcement: string;
};

/**
 * Fallbacks used only until staff fill the Settings form in. They match the
 * values the site shipped with, so a fresh install still renders a usable page
 * rather than an empty shell.
 */
const SETTINGS_FALLBACK: Settings = {
  name: "Kivia Designs",
  tagline: "Kurti manufacture, Ahmedabad",
  description:
    "Kivia Designs is a kurti manufacturing house in Ahmedabad. Browse cotton, rayon, georgette and chanderi kurtis, kurti pant sets and co-ord sets, and order anywhere in India.",
  url: "https://kiviadesigns.in",
  locale: "en_IN",
  phone: "9727815381",
  whatsapp: "919727815381",
  email: "hello@kiviadesigns.in",
  instagram: "kiviakurtis",
  instagramUrl: "https://www.instagram.com/kiviakurtis/",
  city: "Ahmedabad",
  region: "Gujarat",
  country: "India",
  addressLines: ["Replace with your shop name and street", "Ahmedabad, Gujarat - 380001"],
  mapQuery: "Kivia Designs Ahmedabad",
  hours: [
    { days: "Monday to Saturday", time: "10:30 AM - 8:30 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  minimumOrderQuantity: 20,
  announcement: "",
};

/**
 * Payload returns absolute URLs built from serverURL. Converting to a
 * site-relative path matters: next/image refuses to optimise an absolute src
 * unless that exact hostname is allow-listed, so an absolute localhost URL
 * breaks the page the moment the CMS is switched on.
 *
 * Only URLs on our own host are made relative. An upload living in object
 * storage (Cloudflare R2, S3) has a genuinely different host, and rewriting it
 * to a path would send the browser looking for the file on the web server,
 * where it does not exist.
 */
const SITE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
})();

function absolute(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (parsed.origin === SITE_ORIGIN) {
        return `${parsed.pathname}${parsed.search}`;
      }
      // A different host: object storage, or an Instagram CDN image. Keep it.
      return url;
    } catch {
      return null;
    }
  }

  return url;
}

type MediaDoc = { url?: string | null; alt?: string | null } | number | string | null;

function mediaUrl(media: MediaDoc): string | null {
  if (!media || typeof media === "number" || typeof media === "string") return null;
  return absolute(media.url ?? null);
}

function mediaAlt(media: MediaDoc, fallback: string): string {
  if (!media || typeof media === "number" || typeof media === "string") return fallback;
  return media.alt || fallback;
}

/**
 * The read-only connection, used by the storefront.
 *
 * Opening the connection can itself fail — during a production build, or on a
 * host whose database has not finished waking. `getPayload` throws in that case,
 * and a throw here would fail the build rather than render the page from
 * defaults. Reads therefore get a null and fall back; the write paths on the
 * operations side still use getDB and are allowed to throw, because silently
 * dropping a payment is worse than a visible error.
 */
const getReadDB = cache(async () => {
  try {
    return await getPayload({ config });
  } catch {
    return null;
  }
});

/**
 * The catalogue as defined in code, used when the database cannot be read.
 *
 * These are exactly the 11 styles the seed imports into the CMS, and their
 * photographs are committed under public/products, so this is the same shop
 * rather than a placeholder. It means the storefront renders the full catalogue
 * before the CMS has been connected, and keeps rendering it if the database is
 * ever unreachable, instead of showing a server error to a customer.
 */
function catalogFallback(): Product[] {
  return catalogProducts.map((p, index) => ({
    id: index + 1,
    slug: p.slug,
    name: p.name || "",
    category: p.category,
    fabric: p.fabric ?? null,
    occasions: p.occasions ?? [],
    sizes: p.sizes ?? [],
    shortNote: p.shortNote || "",
    colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex ?? "" })),
    length: p.length || "",
    work: p.work || "",
    details: p.details ?? [],
    care: p.care ?? [],
    image: p.image,
    alt: `${p.name || p.category}${p.fabric ? ` in ${p.fabric}` : ""}, Kivia Designs`,
    instagramUrl: p.instagramUrl || "",
    instagramCode: p.instagramCode || "",
    featured: Boolean(p.featured),
    isNew: Boolean(p.isNew),
    sortOrder: index,
    // Bulk rates are never published on the storefront, matching the seed.
    rateCardPrice: null,
    seasonSlug: null,
    seasonTitle: null,
  }));
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const payload = await getReadDB();
  // No database yet: render the built-in catalogue rather than fail the page.
  if (!payload) return catalogFallback();

  try {
    const { docs } = await payload.find({
    collection: "products",
    // draft: false is what stops unpublished styles reaching the storefront.
    draft: false,
    depth: 1,
    limit: 200,
    sort: ["sortOrder", "-createdAt"],
  });

  return docs.map((doc) => {
    const fallbackAlt = doc.name || doc.category;
    return {
      id: doc.id,
      slug: doc.slug ?? doc.instagramCode ?? String(doc.id),
      name: doc.name || "",
      category: doc.category,
      fabric: doc.fabric ?? null,
      occasions: doc.occasions ?? [],
      sizes: doc.sizes ?? [],
      shortNote: doc.shortNote || "",
      colors: (doc.colors ?? []).map((c) => ({ name: c.name, hex: c.hex ?? "" })),
      length: doc.length || "",
      work: doc.work || "",
      details: (doc.details ?? []).map((d) => d.detail),
      care: (doc.care ?? []).map((c) => c.instruction),
      image: mediaUrl(doc.image as MediaDoc),
      alt: mediaAlt(doc.image as MediaDoc, fallbackAlt),
      instagramUrl: doc.instagramUrl || "",
      instagramCode: doc.instagramCode || "",
featured: Boolean(doc.featured),
      isNew: Boolean(doc.isNew),
      sortOrder: doc.sortOrder ?? 0,
      rateCardPrice: doc.rateCardPrice ?? null,
      // `depth: 1` above means the relation arrives populated; fall back to the
      // id form for safety so the shape is always the same.
      seasonSlug:
        doc.season && typeof doc.season === "object"
          ? (doc.season.slug ?? null)
          : typeof doc.season === "string"
            ? doc.season
            : null,
      seasonTitle:
        doc.season && typeof doc.season === "object" ? (doc.season.title ?? null) : null,
    };
    });
  } catch {
    // A reading failure should not blank the catalogue.
    return catalogFallback();
  }
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
});

export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  const all = await getProducts();
  return all.filter((p) => p.featured);
});

export const getRelatedProducts = cache(
  async (product: Product, limit = 4): Promise<Product[]> => {
    const all = await getProducts();
    return all
      .filter((p) => p.slug !== product.slug)
      .sort((a, b) => {
        const score = (p: Product) =>
          (p.category === product.category ? 2 : 0) + (p.fabric === product.fabric ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, limit);
  },
);

export const getAllFabrics = cache(async (): Promise<string[]> => {
  const all = await getProducts();
  return [...new Set(all.map((p) => p.fabric).filter((f): f is string => Boolean(f)))];
});

export const getAllCategories = cache(async (): Promise<string[]> => {
  const all = await getProducts();
  return [...new Set(all.map((p) => p.category))];
});

export const getAllOccasions = cache(async (): Promise<string[]> => {
  const all = await getProducts();
  return [...new Set(all.flatMap((p) => p.occasions))];
});

export const getSettings = cache(async (): Promise<Settings> => {
  const payload = await getReadDB();
  if (!payload) return SETTINGS_FALLBACK;

  try {
    const doc = await payload.findGlobal({ slug: "settings", depth: 0 });
    if (!doc) return SETTINGS_FALLBACK;

    const lines = (doc.addressLines ?? [])
      .map((l) => l.line)
      .filter((l): l is string => Boolean(l && l.trim()));

    return {
      name: doc.siteName || SETTINGS_FALLBACK.name,
      tagline: doc.tagline || SETTINGS_FALLBACK.tagline,
      description: doc.description || SETTINGS_FALLBACK.description,
      url: doc.siteUrl || SETTINGS_FALLBACK.url,
      locale: SETTINGS_FALLBACK.locale,
      phone: doc.phone || SETTINGS_FALLBACK.phone,
      whatsapp: doc.whatsapp || SETTINGS_FALLBACK.whatsapp,
      email: doc.email || SETTINGS_FALLBACK.email,
      instagram: doc.instagramHandle || SETTINGS_FALLBACK.instagram,
      instagramUrl: `https://www.instagram.com/${doc.instagramHandle || SETTINGS_FALLBACK.instagram}/`,
      city: doc.city || SETTINGS_FALLBACK.city,
      region: doc.region || SETTINGS_FALLBACK.region,
      country: SETTINGS_FALLBACK.country,
      // An empty address block should not blank out the footer, so the stored
      // lines replace the placeholder only once there are some.
      addressLines: lines.length ? lines : SETTINGS_FALLBACK.addressLines,
      mapQuery: doc.mapQuery || SETTINGS_FALLBACK.mapQuery,
      hours: (doc.hours ?? []).length
        ? doc.hours!.map((h) => ({ days: h.days, time: h.time }))
        : SETTINGS_FALLBACK.hours,
      minimumOrderQuantity: doc.minimumOrderQuantity ?? SETTINGS_FALLBACK.minimumOrderQuantity,
      announcement: doc.announcement || "",
    };
  } catch {
    // A missing database should not take the whole storefront down.
    return SETTINGS_FALLBACK;
  }
});

/**
 * Page copy is optional. Where no record exists the caller keeps its existing
 * hardcoded wording, so the site is never missing a page.
 */
export type PageContent = {
  title: string;
  eyebrow: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
};

export const getPage = cache(async (slug: string): Promise<PageContent | null> => {
  const payload = await getReadDB();
  if (!payload) return null;

  try {
    const { docs } = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug } },
      draft: false,
      limit: 1,
      depth: 0,
    });
    const doc = docs[0];
    if (!doc) return null;
    return {
      title: doc.title,
      eyebrow: doc.eyebrow || "",
      lead: doc.lead || "",
      seoTitle: doc.seoTitle || "",
      seoDescription: doc.seoDescription || "",
    };
  } catch {
    return null;
  }
});
/* -------------------------------------------------------------------------
 * Seasonal collections, social posts and the rate card
 * ---------------------------------------------------------------------- */

export type Season = {
  id: number;
  title: string;
  slug: string;
  seasonLabel: string;
  summary: string;
  heroImage: string | null;
  bannerText: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

type MediaLike = { url?: string | null } | number | string | null;

function mediaSrc(media: MediaLike): string | null {
  if (!media || typeof media === "number" || typeof media === "string") return null;
  return absolute(media.url ?? null);
}

function toSeason(doc: {
  id: number;
  title: string;
  slug: string;
  seasonLabel?: string | null;
  summary?: string | null;
  heroImage?: MediaLike;
  bannerText?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sortOrder?: number | null;
}): Season {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    seasonLabel: doc.seasonLabel ?? "",
    summary: doc.summary ?? "",
    heroImage: mediaSrc(doc.heroImage ?? null),
    bannerText: doc.bannerText ?? "",
    seoTitle: doc.seoTitle ?? "",
    seoDescription: doc.seoDescription ?? "",
    sortOrder: doc.sortOrder ?? 0,
  };
}

export const getSeasons = cache(async (): Promise<Season[]> => {
  const payload = await getReadDB();
  if (!payload) return [];

  const { docs } = await payload.find({
    collection: "seasonal-collections",
    draft: false,
    depth: 1,
    limit: 50,
    sort: ["sortOrder", "title"],
  });
  return docs.map(toSeason);
});

export const getSeason = cache(async (slug: string): Promise<Season | null> => {
  const seasons = await getSeasons();
  return seasons.find((s) => s.slug === slug) ?? null;
});

/** Styles belonging to a given season, keeping the catalogue's own ordering. */
export const getProductsInSeason = cache(async (seasonSlug: string): Promise<Product[]> => {
  const all = await getProducts();
  const season = all.filter((p) => p.seasonSlug === seasonSlug);
  return season.length ? season : all;
});

export type SocialPost = {
  id: number;
  image: string;
  caption: string;
  permalink: string;
  postedAt: string | null;
};

/**
 * Recent Instagram posts for the homepage strip.
 *
 * Only published posts are read, and the public read rule on the collection
 * already filters out anything unticked, so an unpublished post cannot appear
 * even if this query were changed.
 */
export const getSocialPosts = cache(async (limit = 6): Promise<SocialPost[]> => {
  const payload = await getReadDB();
  if (!payload) return [];

  const { docs } = await payload.find({
    collection: "social-posts",
    where: { published: { equals: true } },
    draft: false,
    depth: 1,
    limit,
    sort: ["-postedAt", "-createdAt"],
  });

  return docs
    .map((doc) => ({
      id: doc.id,
      image: mediaSrc(doc.image as MediaLike) ?? "",
      caption: doc.caption ?? "",
      permalink: doc.permalink ?? "",
      postedAt: doc.postedAt ?? null,
    }))
    .filter((p) => p.image !== "");
});
