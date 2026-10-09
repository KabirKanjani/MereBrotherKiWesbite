import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the real logo if one has been saved, otherwise null so callers can
 * fall back to the wordmark.
 *
 * A logo in /public/brand is a normal state, not an error, so this never throws.
 *
 * Exported as a function as well as a constant, because the Payload config
 * runs in a plain Node process where the public URL is not enough on its own.
 */
export function resolveLogoSrc(): string | null {
  const dir = path.join(process.cwd(), "public", "brand");
  if (!fs.existsSync(dir)) return null;

  const found = fs
    .readdirSync(dir)
    .filter((f) => /^logo\.(png|jpg|jpeg|webp|avif|svg)$/i.test(f))
    .sort();

  if (!found.length) return null;
  return `/brand/${found[0]}`;
}

export const logoSrc = resolveLogoSrc();