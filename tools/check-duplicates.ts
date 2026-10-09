/**
 * Finds duplicate values in any field marked unique, plus any rows whose slug is
 * missing.
 *
 * Payload creates a unique index per unique field. If two documents share a
 * value, adding the field later, or restoring a backup, leaves the database
 * unable to build that index — which then breaks every write to the collection
 * with an opaque Drizzle error rather than a message about the real problem.
 *
 * Run with: node --import tsx tools/check-duplicates.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

const UNIQUE_FIELDS: Record<string, string[]> = {
  products: ["slug", "instagramCode"],
  pages: ["slug"],
  "seasonal-collections": ["slug"],
  users: ["email"],
  enquiries: [],
  "stockist-applications": [],
  media: [],
};

let problems = 0;

async function main() {
  const payload = await getPayload({ config });

  for (const [slug, fields] of Object.entries(UNIQUE_FIELDS)) {
    let docs: Record<string, unknown>[];
    try {
      const res = await payload.find({
        collection: slug as "products",
        limit: 500,
        depth: 0,
        draft: true,
        pagination: false,
      });
      docs = res.docs as unknown as Record<string, unknown>[];
    } catch (e) {
      console.log(`  ! could not read ${slug}: ${e instanceof Error ? e.message : e}`);
      problems += 1;
      continue;
    }

    for (const field of fields) {
      const seen = new Map<string, unknown[]>();
      const missing: unknown[] = [];

      for (const doc of docs) {
        const value = doc[field];
        if (value === null || value === undefined || value === "") {
          missing.push(doc.id);
          continue;
        }
        const list = seen.get(String(value)) ?? [];
        list.push(doc.id);
        seen.set(String(value), list);
      }

      const dupes = [...seen.entries()].filter(([, ids]) => ids.length > 1);

      if (dupes.length === 0 && missing.length === 0) {
        console.log(`  ok  ${slug}.${field} — all ${docs.length} unique`);
        continue;
      }

      problems += dupes.length;
      for (const [value, ids] of dupes) {
        console.log(`  XX  ${slug}.${field} duplicate "${value}" on ids ${ids.join(", ")}`);
      }
      if (missing.length) {
        // Missing values are usually fine, since Payload allows them to repeat,
        // but they are worth knowing about because the slug then cannot be filled.
        console.log(`  ..  ${slug}.${field} empty on ids ${missing.join(", ")}`);
      }
    }
  }

  console.log(problems === 0 ? "\nNo duplicates found." : `\n${problems} duplicate group(s).`);
  process.exit(problems === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});