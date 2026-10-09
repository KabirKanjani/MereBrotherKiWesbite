/**
 * One-off import of the existing catalogue into the CMS.
 *
 * Everything here is read from the files that were already there — catalog.ts
 * and site.ts — so no product name, fabric or caption is invented during the
 * move. The script is idempotent: run it twice and it updates rather than
 * duplicating.
 *
 * Staff accounts are deliberately NOT created here. Passwords should never pass
 * through a script. The first account is created by hand at
 * /admin/create-first-user, where the password is typed into the browser.
 *
 * Run with: npm run seed
 */

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";

import config from "../payload.config";
import { products as catalogProducts } from "../src/lib/catalog";
import { site } from "../src/lib/site";
import type { Product as CmsProduct } from "../payload-types";

/** The exact option sets the Products collection accepts. */
type CmsSize = NonNullable<CmsProduct["sizes"]>[number];
type CmsCategory = NonNullable<CmsProduct["category"]>;

const ROOT = process.cwd();
const PRODUCT_PHOTOS = path.join(ROOT, "public", "products");

async function seedMedia() {
  const payload = await getPayload({ config });
  const files = fs
    .readdirSync(PRODUCT_PHOTOS)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  const bySlug = new Map<string, number>();

  for (const file of files) {
    const slug = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    const full = path.join(PRODUCT_PHOTOS, file);

    // Alt text comes from the product's own note, falling back to its category,
    // so the description is never a bare filename.
    const product = catalogProducts.find((p) => p.slug === slug);
    const alt = product
      ? `${product.name || product.category}${product.fabric ? ` in ${product.fabric}` : ""}, Kivia Designs`
      : `Kivia Designs ${slug}`;

    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: file } },
      limit: 1,
    });

    if (existing.docs.length) {
      const doc = existing.docs[0];
      await payload.update({
        collection: "media",
        id: doc.id,
        data: { alt },
      });
      bySlug.set(slug, doc.id as number);
      console.log(`  = media ${file}`);
      continue;
    }

    const created = await payload.create({
      collection: "media",
      data: { alt },
      filePath: full,
    });

    bySlug.set(slug, created.id as number);
    console.log(`  + media ${file}`);
  }

  return bySlug;
}

async function seedProducts(mediaBySlug: Map<string, number>) {
  const payload = await getPayload({ config });

  for (const p of catalogProducts) {
    const data = {
      name: p.name || "",
      slug: p.slug,
      category: p.category as CmsCategory,
      fabric: p.fabric ?? null,
      occasions: p.occasions ?? [],
      sizes: (p.sizes ?? []) as CmsSize[],
      shortNote: p.shortNote,
      colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex ?? "" })),
      length: p.length || "",
      work: p.work || "",
      details: (p.details ?? []).map((d) => ({ detail: d })),
      care: (p.care ?? []).map((c) => ({ instruction: c })),
      instagramUrl: p.instagramUrl,
      instagramCode: p.instagramCode,
      featured: Boolean(p.featured),
      isNew: Boolean(p.isNew),
      image: mediaBySlug.get(p.slug) ?? null,
      _status: "published" as const,
    };

    const existing = await payload.find({
      collection: "products",
      where: { slug: { equals: p.slug } },
      limit: 1,
    });

    if (existing.docs.length) {
      await payload.update({
        collection: "products",
        id: existing.docs[0].id,
        data,
        draft: false,
      });
      console.log(`  = product ${p.slug}`);
      continue;
    }

    await payload.create({ collection: "products", data, draft: false });
    console.log(`  + product ${p.slug}`);
  }
}

async function seedSettings() {
  const payload = await getPayload({ config });

  const existing = await payload.findGlobal({
    slug: "settings",
    depth: 0,
  });

  if (existing) {
    console.log("  = settings (already present, leaving as staff have edited it)");
    return;
  }

  await payload.updateGlobal({
    slug: "settings",
    data: {
      siteName: site.name,
      tagline: site.tagline,
      description: site.description,
      siteUrl: site.url,
      phone: site.phone,
      whatsapp: site.whatsapp,
      email: site.email,
      instagramHandle: site.instagram,
      shopNameLine: "",
      addressLines: site.addressLines.map((line) => ({ line })),
      city: site.city,
      region: site.region,
      hours: site.hours.map((h) => ({ days: h.days, time: h.time })),
      mapQuery: site.mapQuery,
      minimumOrderQuantity: 20,
      announcement: "",
    },
  });
  console.log("  + settings");
}

async function main() {
  console.log("Importing the existing catalogue into the CMS...\n");
  const mediaBySlug = await seedMedia();
  await seedProducts(mediaBySlug);
  await seedSettings();
  console.log("\nDone. Create the first login at /admin/create-first-user");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});