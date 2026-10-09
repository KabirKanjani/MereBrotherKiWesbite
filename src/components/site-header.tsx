import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/site";
import { generalWhatsappUrl } from "@/lib/whatsapp";
import MobileNav from "@/components/mobile-nav";
import BrandMark from "@/components/brand-mark";
import { logoSrc } from "@/lib/logo";
import type { Settings } from "@/lib/cms";

/**
 * Shows artwork from /public/brand when a designer-supplied logo has been
 * dropped in, and otherwise pairs the built BrandMark with the wordmark.
 * The wordmark is always present, because on its own it is a complete, legible
 * identity and the mark is a supporting element rather than a replacement.
 */
export function Logo({
  tone = "dark",
  name,
  city,
}: {
  tone?: "dark" | "light";
  name: string;
  city: string;
}) {
  const main = tone === "light" ? "text-linen" : "text-ink";
  const sub = tone === "light" ? "text-linen/60" : "text-ink-soft";

  const mark = logoSrc ? (
    <Image
      src={logoSrc}
      alt={`${name} logo`}
      width={256}
      height={256}
      priority
      /*
       * Served unoptimised on purpose. The image optimiser re-encoded this file
       * for each slot and, at the 44px header size, mangled the alpha channel
       * badly enough that the mark rendered as a dark haze. The file is already
       * 256px, so there is nothing left to gain from re-encoding it.
       */
      unoptimized
      className="h-11 w-11 object-contain"
    />
  ) : (
    <BrandMark tone={tone} className="h-11 w-11 shrink-0" />
  );

  return (
    <span className="flex items-center gap-3">
      {/*
        The logo is purple and coral with no dark ink in it, so on the ink
        footer it drops to about 2.4:1 against the background. Giving it a light
        plate keeps it legible without recolouring artwork we do not own.
      */}
      {tone === "light" ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linen p-1">
          {mark}
        </span>
      ) : (
        mark
      )}
      <span className={`flex flex-col leading-none ${main}`}>
        <span className="font-display text-xl tracking-tight">{name}</span>
        <span className={`mt-1 text-[0.5625rem] uppercase tracking-[0.3em] ${sub}`}>
          {city}
        </span>
      </span>
    </span>
  );
}

export default function SiteHeader({ settings }: { settings: Settings }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-linen/90 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${settings.name} home`} className="shrink-0">
          <Logo name={settings.name} city={settings.city} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.8125rem] text-ink-soft transition-colors hover:text-clay"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[0.8125rem] text-ink-soft transition-colors hover:text-clay sm:inline"
          >
            Instagram
          </a>
          <a
            href={generalWhatsappUrl(settings.whatsapp)}
            className="btn btn-primary hidden sm:inline-flex"
          >
            WhatsApp Us
          </a>
          <Link href="/enquiry" className="btn btn-outline">
            Enquire
          </Link>
          <MobileNav settings={settings} />
        </div>
      </div>
    </header>
  );
}