/**
 * Fills the Settings document from the shop details that were previously
 * hardcoded in src/lib/site.ts.
 *
 * The CMS settings record was created empty, which left the storefront falling
 * back to those hardcoded values. That is confusing in practice: the admin form
 * showed blank fields while the website displayed a phone number, so the two
 * disagreed and there was no obvious place to make a change.
 *
 * This copies the real values across once. After that, editing the form in the
 * admin is what changes the site.
 *
 * Safe to run repeatedly: existing values are left alone unless --force is
 * passed, so it will never overwrite something staff have typed in.
 *
 * Run with: node --import tsx tools/seed-settings.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";
import { site } from "../src/lib/site";

const force = process.argv.includes("--force");

async function main() {
  const payload = await getPayload({ config });
  const existing = await payload.findGlobal({ slug: "settings", depth: 0 });

  const current = existing ?? ({} as Record<string, unknown>);
  const hasContent = Boolean(
    current.phone || current.whatsapp || (current.addressLines as unknown[])?.length,
  );

  if (hasContent && !force) {
    console.log("Settings already contain shop details. Nothing changed.");
    console.log("Pass --force to overwrite them from the hardcoded values.");
    process.exit(0);
  }

  const data = {
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
  };

  if (existing) {
    await payload.updateGlobal({ slug: "settings", data });
    console.log("Settings updated from the shop details.");
  } else {
    await payload.updateGlobal({ slug: "settings", data });
    console.log("Settings created.");
  }

  console.log(`  phone      ${data.phone}`);
  console.log(`  whatsapp   ${data.whatsapp}`);
  console.log(`  address    ${data.addressLines.map((l) => l.line).join(" / ")}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});