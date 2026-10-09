"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { navLinks } from "@/lib/site";
import type { Settings } from "@/lib/cms";
import { generalWhatsappUrl } from "@/lib/whatsapp";

export default function MobileNav({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-mr-2 flex h-10 w-10 items-center justify-center"
      >
        <span className="relative block h-3.5 w-5">
          <span
            className={`absolute left-0 block h-px w-5 bg-ink transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 block h-px w-5 bg-ink transition-opacity duration-200 ${open ? "opacity-0" : "top-1.5 opacity-100"}`}
          />
          <span
            className={`absolute left-0 block h-px w-5 bg-ink transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
          />
        </span>
      </button>

      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-linen"
        >
          <nav aria-label="Mobile" className="wrap flex flex-col py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-display text-2xl text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/enquiry"
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 font-display text-2xl text-ink"
            >
              Enquire
            </Link>
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-line py-4 font-display text-2xl text-ink"
            >
              Instagram
            </a>

            <div className="mt-8 flex flex-col gap-3">
              <a href={generalWhatsappUrl(undefined, settings.whatsapp)} className="btn btn-primary w-full">
                Chat on WhatsApp
              </a>
<a href={`tel:${settings.phone}`} className="btn btn-outline w-full">
            Call {settings.phone}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}