/**
 * Finds and removes products that are clearly test leftovers.
 *
 * Two specific shapes get cleaned up:
 *
 *  1. Drafts with no name, no photo and no description. These are invisible to
 *     customers but still appear in the admin list, and an unnamed row with no
 *     picture is confusing to anyone trying to work out what is real.
 *  2. Anything carrying the temporary slug the verification scripts use.
 *
 * Real styles are never touched: a product with a name or a photograph is left
 * alone, and nothing published is removed even if it looks bare.
 *
 * Run with: node --import tsx tools/clean-stray-drafts.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  const all = await payload.find({
    collection: "products",
    limit: 200,
    depth: 0,
    draft: true,
  });

  const strays = all.docs.filter((p) => {
    const isTemporarySlug = /^(temp-draft|temp-|roundtrip)/i.test(p.slug ?? "");
    const isEmptyDraft =
      p._status === "draft" &&
      !(p.name ?? "").trim() &&
      !p.image &&
      !(p.shortNote ?? "").trim();

    return isTemporarySlug || isEmptyDraft;
  });

  if (strays.length === 0) {
    console.log(`Checked ${all.totalDocs} styles. Nothing looks like a test leftover.`);
    process.exit(0);
  }

  console.log(`Found ${strays.length} leftover:\n`);
  for (const stray of strays) {
    console.log(`  #${stray.id} slug=${stray.slug} status=${stray._status}`);
    await payload.delete({ collection: "products", id: stray.id });
    console.log("    removed");
  }

  const after = await payload.find({
    collection: "products",
    limit: 200,
    depth: 0,
    draft: true,
  });
  console.log(`\n${after.totalDocs} styles remain.`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});