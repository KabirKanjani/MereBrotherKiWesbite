/**
 * Removes test enquiries and stockist applications.
 *
 * Used after checking that the public forms actually store leads, since that
 * check necessarily leaves a record behind. Only rows that look like test data
 * are touched: anything with a name, business name or note that reads like a
 * real enquiry is left alone.
 *
 * Run with: node --import tsx tools/clear-test-leads.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

const TEST_MARKERS = [/test buyer/i, /priya fashions/i, /rate card for the dzn/i, /discarded \(spam\)/i];

async function main() {
  const payload = await getPayload({ config });

  const collections = [
    { slug: "enquiries" as const, fields: ["name", "notes", "interest"] },
    { slug: "stockist-applications" as const, fields: ["businessName", "message", "ownerName"] },
  ];

  let removed = 0;

  for (const { slug, fields } of collections) {
    const { docs } = await payload.find({ collection: slug, limit: 500, depth: 0 });

    for (const doc of docs) {
      const haystack = fields
        .map((f) => String((doc as unknown as Record<string, unknown>)[f] ?? ""))
        .join(" ");
      const isTest = TEST_MARKERS.some((re) => re.test(haystack));

      if (!isTest) continue;

      await payload.delete({ collection: slug, id: doc.id });
      removed += 1;
      console.log(`  removed test ${slug} #${doc.id}`);
    }
  }

  console.log(removed === 0 ? "\nNo test leads found." : `\nRemoved ${removed} test record(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});