"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logout, useAuth } from "@payloadcms/ui";

/**
 * The admin sidebar, rebuilt as a calm, tappable menu.
 *
 * This deliberately shows only what changes what visitors see: the styles, their
 * photos, the homepage feed, the page wording and the shop's own details. The
 * wholesale side — enquiries, orders, buyers, stock and the factory — is kept in
 * the system but left out of the menu, so signing in does not open onto a wall
 * of fifteen links nobody uses day to day. Those screens are still reachable by
 * their own address if they ever need them.
 *
 * Section open/closed is remembered in the browser, so the menu comes back the
 * way you left it.
 */

type Tile = {
  label: string;
  hint: string;
  href: string;
  glyph: string;
};

const tiles: Tile[] = [
  {
    label: "Add a style",
    hint: "New kurti",
    href: "/admin/collections/products/create",
    glyph: "+",
  },
  {
    label: "Add a photo",
    hint: "Upload",
    href: "/admin/collections/media/create",
    glyph: "◉",
  },
  {
    label: "Edit wording",
    hint: "Page text",
    href: "/admin/collections/pages",
    glyph: "✎",
  },
  {
    label: "Website",
    hint: "View live",
    href: null as unknown as string,
    glyph: "↗",
  },
];

type Item = { label: string; href: string };
type Section = { title: string; items: Item[] };

/**
 * Sections that start open, so the common work is one glance away and the rest
 * stays tucked away.
 */
const DEFAULT_OPEN: Record<string, boolean> = {
  "Styles & photos": true,
  "Homepage & pages": true,
};

const sections: Section[] = [
  {
    title: "Styles & photos",
    items: [
      { label: "Styles", href: "/admin/collections/products" },
      { label: "Photos", href: "/admin/collections/media" },
    ],
  },
  {
    title: "Homepage & pages",
    items: [
      { label: "Homepage feed", href: "/admin/collections/social-posts" },
      { label: "Page wording", href: "/admin/collections/pages" },
      { label: "Seasons", href: "/admin/collections/seasonal-collections" },
      { label: "Shop details", href: "/admin/globals/settings" },
    ],
  },
  {
    title: "Your account",
    items: [{ label: "Staff accounts", href: "/admin/collections/users" }],
  },
];

const STORE_KEY = "kivia-admin-open-sections";

export default function AdminNav() {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "{}") as Record<
        string,
        boolean
      >;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(open));
    } catch {
      /* storage may be unavailable; the menu still works, it just forgets. */
    }
  }, [open]);

  const liveUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "https://kiviadesigns.onrender.com";

  const isActive = useMemo(
    () => (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  const toggle = (title: string) => setOpen((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1rem 0.75rem" }}>
      <header style={{ padding: "0 0.5rem" }}>
        <div
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "1.25rem",
            lineHeight: 1.1,
          }}
        >
          Kivia Designs
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.15rem" }}>
          {user?.email}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        {tiles.map((t) => {
          const external = t.label === "Website";
          const inner = (
            <>
              <span
                aria-hidden
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: "6px",
                  background: "var(--theme-elevation-100)",
                  fontSize: "0.9rem",
                  lineHeight: 1,
                }}
              >
                {t.glyph}
              </span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.label}</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>{t.hint}</span>
              </span>
            </>
          );

          const style = {
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.55rem 0.6rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "8px",
            background: "var(--theme-elevation-50)",
            color: "inherit",
            textDecoration: "none",
            transition: "transform 120ms ease, background-color 120ms ease",
          };

          return external ? (
            <a key={t.label} href={liveUrl} target="_blank" rel="noreferrer" style={style}>
              {inner}
            </a>
          ) : (
            <Link key={t.label} href={t.href} style={style}>
              {inner}
            </Link>
          );
        })}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {sections.map((section) => {
          const isOpen = open[section.title] ?? DEFAULT_OPEN[section.title] ?? false;
          const active = section.items.some((i) => isActive(i.href));

          return (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => toggle(section.title)}
                aria-expanded={isOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  background: "transparent",
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "8px",
                  color: active ? "var(--theme-success-500)" : "inherit",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span>{section.title}</span>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    transition: "transform 150ms ease",
                    transform: isOpen ? "rotate(90deg)" : "none",
                    opacity: 0.7,
                  }}
                >
                  ›
                </span>
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 180ms ease",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <ul style={{ listStyle: "none", margin: "0.25rem 0 0.35rem", padding: 0 }}>
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          style={{
                            display: "block",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            textDecoration: "none",
                            color: isActive(item.href)
                              ? "var(--theme-success-500)"
                              : "inherit",
                            background: isActive(item.href)
                              ? "var(--theme-elevation-75)"
                              : "transparent",
                            fontSize: "0.875rem",
                          }}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid var(--theme-elevation-150)" }}>
        <Logout />
      </div>
    </div>
  );
}
