/**
 * Kivia Designs brand mark.
 *
 * Drawn as inline SVG rather than shipped as a bitmap for three reasons:
 *   - it is resolution independent, so the favicon and the 44px header are the
 *     same artwork with no second file to maintain;
 *   - it takes its colours from the theme, so the header (on linen) and the
 *     footer (on ink) both get correct contrast from one component;
 *   - a palette change in globals.css moves the logo with everything else
 *     instead of leaving it stranded on old colours.
 *
 * This is a working mark for the site, not a finished brand identity. To use
 * artwork from a designer instead, drop a file in /public/brand and
 * src/lib/logo.ts will prefer it over this.
 */

export default function BrandMark({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  // The ring and the K share one colour so the mark reads as a single form.
  // The diagonals take the accent, which is what makes it identifiable at 20px.
  const structure = tone === "light" ? "stroke-linen" : "stroke-ink";
  const accent = tone === "light" ? "stroke-saffron" : "stroke-clay";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Kivia Designs"
      className={className}
    >
      {/* Ring, echoing the stitched border of a kurti hem. */}
      <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" className={structure} />

      {/* K. Shifted left of centre so the open counters sit optically even. */}
      <g
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-14 0)"
      >
        <path d="M30 22 V78" className={structure} />
        <path d="M32 50 L64 22" className={accent} />
        <path d="M32 50 L64 78" className={accent} />
      </g>
    </svg>
  );
}