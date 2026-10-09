/**
 * Summarises the content state of the shop: how many styles exist, how many have
 * been named, and whether the store address has been filled in.
 *
 * Both of those are the things that most affect whether the site is ready to
 * show a customer, and both are easy to forget because nothing errors when they
 * are blank.
 */

import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    limit: 100,
    depth: 0,
    draft: true,
  });

  const named = products.docs.filter((p) => (p.name ?? "").trim().length > 0);
  const photographed = products.docs.filter((p) => p.image);
  const featured = products.docs.filter((p) => p.featured);
  const drafts = products.docs.filter((p) => p._status === "draft");

  console.log("Styles");
  console.log(`  total          ${products.totalDocs}`);
  console.log(`  named          ${named.length}`);
  console.log(`  with a photo   ${photographed.length}`);
  console.log(`  featured       ${featured.length}`);
  console.log(`  still draft    ${drafts.length}`);

  const settings = await payload.findGlobal({ slug: "settings", depth: 0 });
  const lines = (settings.addressLines ?? []).map((l) => l.line).filter(Boolean);

  console.log("\nShop details");
  console.log(`  phone          ${settings.phone ?? "(empty)"}`);
  console.log(`  whatsapp       ${settings.whatsapp ?? "(empty)"}`);
  console.log(`  address        ${lines.length ? lines.join(" / ") : "(empty)"}`);
  console.log(`  minimum order  ${settings.minimumOrderQuantity ?? "(empty)"}`);

  const gaps: string[] = [];
  if (products.totalDocs > 0 && named.length === 0) {
    gaps.push("No style has a name yet. Cards show the type instead.");
  }
  if (lines.some((l) => /replace with/i.test(l))) {
    gaps.push("The address is still placeholder text.");
  }
  if (featured.length < 4) {
    gaps.push(`Only ${featured.length} style(s) are featured; four fills the homepage row.`);
  }

  console.log("");
  if (gaps.length) {
    console.log("Still to do before this is customer-ready:");
    gaps.forEach((g) => console.log(`  - ${g}`));
  } else {
    console.log("Nothing outstanding in the content.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});