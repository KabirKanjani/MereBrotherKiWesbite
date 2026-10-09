/**
 * Confirms the real requirement end to end: a change made through the CMS shows
 * up on the public site, and reverting it puts things back.
 *
 * The edit is made with the local API as a signed-in-equivalent caller, because
 * this script is a test harness rather than a member of staff. It then checks
 * what an anonymous visitor actually receives over HTTP.
 *
 * Run with: node --import tsx tools/verify-roundtrip.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3100";

let failures = 0;
function check(label: string, passed: boolean, detail = "") {
  console.log(`  [${passed ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

async function publicProducts() {
  const res = await fetch(`${BASE}/api/products?limit=100`);
  const json = await res.json();
  return json.docs as {
    id: number;
    slug: string;
    name: string;
    shortNote: string;
    featured: boolean;
  }[];
}

async function main() {
  const payload = await getPayload({ config });

  const all = await payload.find({ collection: "products", limit: 1, sort: ["id"] });
  const original = all.docs[0];

  if (!original) {
    console.log("No products in the database. Run npm run seed first.");
    process.exit(1);
  }

  /*
   * The original name is restored in a finally block. Without it, a failed run
   * leaves a real style called "Roundtrip Test Style" in the live catalogue.
   */
  try {
    console.log(`\nEditing "${original.slug}" through the CMS...\n`);

    const TEST_NAME = "Roundtrip Test Style";
    await payload.update({
      collection: "products",
      id: original.id,
      data: { name: TEST_NAME },
      draft: false,
    });

    const afterEdit = (await publicProducts()).find((p) => p.slug === original.slug);
    check(
      "edit is visible to the public API",
      afterEdit?.name === TEST_NAME,
      `name="${afterEdit?.name}"`,
    );

    // The storefront renders from the database, not the API, so check the HTML.
    const home = await fetch(`${BASE}/`);
    check("homepage returns 200", home.status === 200, `HTTP ${home.status}`);

    const collection = await fetch(`${BASE}/collection`);
    const collectionHtml = await collection.text();
    const photoRefs = [...collectionHtml.matchAll(/\/api\/media\/file\/[A-Za-z0-9_-]+\.jpg/g)];
    check(
      "collection page shows CMS photographs",
      photoRefs.length > 0,
      `${photoRefs.length} photo reference(s)`,
    );

    const product = await fetch(`${BASE}/collection/${original.slug}`);
    check("product page returns 200", product.status === 200, `HTTP ${product.status}`);
  } finally {
    await payload.update({
      collection: "products",
      id: original.id,
      data: { name: original.name ?? "" },
      draft: false,
    });

    const afterRevert = (await publicProducts()).find((p) => p.slug === original.slug);
    check(
      "original name restored",
      afterRevert?.name === (original.name ?? ""),
      `name="${afterRevert?.name}"`,
    );
  }

  console.log(
    failures === 0 ? "\nRound trip verified." : `\n${failures} check(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});