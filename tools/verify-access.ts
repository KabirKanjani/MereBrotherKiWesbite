/**
 * Checks the two rules that matter most for this site:
 *
 *  1. A draft must never be visible to the public.
 *  2. An anonymous visitor must not be able to create, change or delete
 *     anything, no matter which endpoint they call.
 *
 * The test draft is always removed in a finally block. An earlier version
 * cleaned up only on the happy path, so a thrown request or a failed assertion
 * left an empty unnamed draft sitting in the admin's style list.
 *
 * Run with: node --import tsx tools/verify-access.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

let failures = 0;

function check(label: string, passed: boolean, detail = "") {
  const mark = passed ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

type DraftDoc = { id: number | string };

async function removeDraft(payload: Awaited<ReturnType<typeof getPayload>>, draft: DraftDoc) {
  try {
    await payload.delete({ collection: "products", id: draft.id });
  } catch {
    // Already gone, or the collection is mid-migration. Nothing more to do.
  }
}

async function main() {
  const payload = await getPayload({ config });

  const anyProducts = await payload.find({ collection: "products", limit: 1, sort: ["id"] });
  if (!anyProducts.docs.length) {
    console.log("No products in the database. Run npm run seed first.");
    process.exit(1);
  }

  let draft: DraftDoc | null = null;

  try {
    draft = await payload.create({
      collection: "products",
      data: {
        name: "TEMP DRAFT - safe to delete",
        slug: "temp-draft-check",
        category: "Kurti",
        shortNote: "Draft visibility check.",
        _status: "draft",
      },
      draft: true,
    });
    console.log(`\nCreated draft id=${draft.id}\n`);

    console.log("Draft visibility:");
    const pubRes = await fetch(`${BASE}/api/products?where[slug][equals]=temp-draft-check&draft=false`);
    const pubJson = await pubRes.json();
    check(
      "public API cannot see the draft",
      pubJson.totalDocs === 0,
      `totalDocs=${pubJson.totalDocs}`,
    );

    console.log("\nAnonymous writes are rejected:");
    const attempts: [string, string, string][] = [
      ["create product", "POST", "/api/products"],
      ["update a product", "PATCH", `/api/products/${draft.id}`],
      ["delete a product", "DELETE", `/api/products/${draft.id}`],
      ["read staff accounts", "GET", "/api/users"],
      ["read enquiries", "GET", "/api/enquiries"],
      ["read stockist applications", "GET", "/api/stockist-applications"],
      ["change shop details", "PATCH", "/api/settings"],
    ];

    for (const [label, method, path] of attempts) {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify({}),
      });
      const denied = res.status === 401 || res.status === 403 || res.status === 404;
      check(`${label} (${method}) denied`, denied, `HTTP ${res.status}`);
    }

    /*
     * Asking for drafts as an anonymous visitor is answered with HTTP 200 and a
     * document list. That is only safe if the list is filtered, so this asserts
     * on the contents rather than the status code.
     */
    console.log("\nDrafts stay private:");
    for (const q of ["draft=true", "draft=1"]) {
      const res = await fetch(`${BASE}/api/products?limit=50&${q}`);
      const json = await res.json();
      const docs: { slug?: string }[] = json.docs ?? [];
      const leaked = docs.filter((d) => d.slug === "temp-draft-check");
      check(
        `?${q} returns no draft documents`,
        leaked.length === 0,
        `${docs.length} published doc(s) returned`,
      );
    }

    const byId = await fetch(`${BASE}/api/products/${draft.id}?draft=true`);
    check(
      "fetching the draft by id does not return it",
      byId.status === 403 || byId.status === 404,
      `HTTP ${byId.status}`,
    );
  } finally {
    if (draft) {
      console.log("\nCleaning up:");
      await removeDraft(payload, draft);

      const remaining = await payload.find({
        collection: "products",
        where: { slug: { equals: "temp-draft-check" } },
        limit: 1,
      });
      check("draft is gone from the database", remaining.totalDocs === 0);
    }
  }

  console.log(
    failures === 0 ? "\nAll access checks passed." : `\n${failures} check(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});