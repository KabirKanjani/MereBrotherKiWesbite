import Image from "next/image";

type Props = {
  src: string | null;
  alt: string;
  seed?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fabric?: string;
  label?: string;
};

/**
 * Placeholder gradients, all drawn from the logo's purple (#6040a0) and coral
 * (#f08060) so a style without a photograph still looks on-brand.
 */
const palettes = [
  ["#EFEAF7", "#6040a0"],
  ["#F7EDE8", "#f08060"],
  ["#EFEDF7", "#7a5cb8"],
  ["#F6EDE9", "#e1704f"],
  ["#E9E4F4", "#2b1f43"],
  ["#F3F0F9", "#503782"],
];

/**
 * Renders the product photo when one has been added to /public/products.
 * Until then it shows a woven-texture placeholder built from the palette so
 * the layout never looks broken.
 */
export default function ProductImage({
  src,
  alt,
  seed = 0,
  className = "",
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
  fabric,
  label,
}: Props) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  const [base, accent] = palettes[seed % palettes.length];
  const angle = 25 + (seed % 4) * 20;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: base }}
      role="img"
      aria-label={alt}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `repeating-linear-gradient(${angle}deg, ${accent}22 0px, ${accent}22 1px, transparent 1px, transparent 7px), repeating-linear-gradient(${angle + 90}deg, ${accent}18 0px, ${accent}18 1px, transparent 1px, transparent 9px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${accent}33 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, ${accent}26 0%, transparent 65%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-linen/80 px-3 py-3 text-center backdrop-blur-[2px]">
        {label ? (
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-clay">
            {label}
          </span>
        ) : null}
        {fabric ? (
          <span className="text-[0.6875rem] text-ink-soft">{fabric} &middot; photo to come</span>
        ) : null}
      </div>
    </div>
  );
}