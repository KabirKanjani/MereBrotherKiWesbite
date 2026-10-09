/**
 * Imports the harvested Instagram posts into the CMS so the homepage strip is
 * populated.
 *
 * The images already exist as media records from the original harvest, so this
 * reuses them rather than uploading anything again.
 *
 * Safe to run more than once: posts are matched on their Instagram permalink,
 * so re-running updates captions instead of creating duplicates.
 *
 * Run with: node --import tsx tools/seed-social.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "../payload.config";

const ROOT = process.cwd();
const HARVEST = path.join(ROOT, "tools", "harvest-data", "posts.json");
const HANDLE = "kiviakurtis";

/** Turns a caption into one short line, without mangling emoji or cutting mid-word. */
function tidyCaption(raw: string, max = 120): string {
  const firstLine = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);

  const text = (firstLine ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max).trimEnd()}...`;
}

async function main() {
  if (!fs.existsSync(HARVEST)) {
    console.error(`No harvest data at ${HARVEST}. Run tools/harvest.mjs first.`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(HARVEST, "utf8"));
  const posts: {
    code?: string;
    url?: string;
    caption?: string;
    postedAt?: string | null;
  }[] = raw.posts ?? raw;

  if (!posts.length) {
    console.error("The harvest file contains no posts.");
    process.exit(1);
  }

  const payload = await getPayload({ config });

  // Find the media record for each post by its filename stem.
  const media = await payload.find({ collection: "media", limit: 200, depth: 0 });
  const byCode = new Map<string, number>();
  for (const m of media.docs) {
    const stem = (m.filename ?? "").replace(/\.(jpg|jpeg|png|webp)$/i, "");
    if (stem) byCode.set(stem, m.id);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const code = post.code;
    if (!code) {
      skipped += 1;
      continue;
    }

    const mediaId = byCode.get(code);
    if (!mediaId) {
      console.log(`  ! no photo found for ${code}, skipping`);
      skipped += 1;
      continue;
    }

    const permalink = post.url ?? `https://www.instagram.com/${HANDLE}/reel/${code}/`;

    const existing = await payload.find({
      collection: "social-posts",
      where: { permalink: { equals: permalink } },
      limit: 1,
      depth: 0,
    });

    const data = {
      image: mediaId,
      caption: tidyCaption(post.caption ?? ""),
      permalink,
      postedAt: post.postedAt ?? undefined,
      published: true,
    };

    if (existing.docs.length) {
      await payload.update({ collection: "social-posts", id: existing.docs[0].id, data });
      updated += 1;
      continue;
    }

    await payload.create({ collection: "social-posts", data });
    created += 1;
  }

  console.log(`\nInstagram posts: ${created} added, ${updated} updated, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});