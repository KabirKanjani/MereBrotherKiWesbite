import Link from "next/link";
import { generalWhatsappUrl } from "@/lib/whatsapp";
import { Logo } from "@/components/site-header";
import type { Settings } from "@/lib/cms";

export default function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-linen">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div className="space-y-5">
          <Logo tone="light" name={settings.name} city={settings.city} />
          <p className="max-w-sm text-sm leading-relaxed text-linen/65">
            A kurti manufacturing house in {settings.city}. We cut, stitch and finish every piece in
            our own workshop, and we sell the same kurtis to you that we sell across our store
            counter.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={generalWhatsappUrl(undefined, settings.whatsapp)} className="btn btn-ghost-light">
              WhatsApp
            </a>
            <Link href="/collection" className="btn btn-ghost-light">
              Browse Collection
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-[0.6875rem] uppercase tracking-[0.22em] text-linen/45">Explore</h2>
          <ul className="mt-5 space-y-3 text-sm">
{[
                { href: "/collection", label: "Collection" },
                { href: "/seasons", label: "Seasons" },
                { href: "/craft", label: "Our Craft" },
                { href: "/bulk", label: "Bulk & Custom Orders" },
                { href: "/become-a-stockist", label: "Become a Stockist" },
                { href: "/rate-card", label: "Rate Card" },
                { href: "/size-guide", label: "Size Guide & Care" },
                { href: "/visit", label: "Visit Our Store" },
                { href: "/enquiry", label: "Enquire" },
              ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-linen/75 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[0.6875rem] uppercase tracking-[0.22em] text-linen/45">Reach Us</h2>
          <ul className="mt-5 space-y-3 text-sm text-linen/75">
            <li>
              <a href={`tel:${settings.phone}`} className="transition-colors hover:text-white">
                {settings.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="transition-colors hover:text-white">
                {settings.email}
              </a>
            </li>
            <li>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                @{settings.instagram}
              </a>
            </li>
            <li className="pt-2 leading-relaxed">
              {settings.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-6 text-xs text-linen/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.name}. All rights reserved.
          </p>
          <p>Crafted in {settings.city}, {settings.country}.</p>
        </div>
      </div>
    </footer>
  );
}