import Image from "next/image";

/**
 * The mark shown on the admin sign-in screen.
 *
 * Payload ships its own logo there, which made the sign-in page read
 * "Payload" rather than the shop's name — confusing for anyone who does not
 * know the tool runs underneath. This replaces it with the Kivia mark beside
 * the shop name.
 *
 * Sized in the same proportion as the default it replaces, around 193 x 44, so
 * the login panel does not reflow.
 *
 * `src` is passed in rather than hardcoded because the admin bundle should not
 * depend on a path that may not exist; src/lib/logo.ts returns null when no
 * artwork has been dropped in, and the caller then falls back to a wordmark.
 */
export default function AdminLogo({ src }: { src?: string | null }) {
  const name = "Kivia Designs";

  if (src) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <Image
          src={src}
          alt=""
          width={44}
          height={44}
          // The logo is purple and coral with no dark ink, so it keeps its own
          // contrast rather than being tinted to match the admin theme.
          unoptimized
          style={{ width: "2.75rem", height: "2.75rem", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: "1.5rem",
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "var(--theme-elevation-1000)",
          }}
        >
          {name}
        </span>
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: "1.5rem",
        lineHeight: 1,
        color: "var(--theme-elevation-1000)",
      }}
    >
      {name}
    </span>
  );
}