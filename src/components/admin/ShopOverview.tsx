import Link from "next/link";
import { getPayload } from "payload";
// A relative path rather than the `@payload-config` alias: the Payload CLI
// loads this file outside the Next build and does not resolve tsconfig aliases.
import config from "../../../payload.config";

/**
 * A dashboard panel answering the questions staff actually open the admin to ask.
 *
 * Payload's default dashboard is a list of every collection, which tells a
 * non-technical user nothing useful. This leads with the three things worth
 * knowing at a glance: how many styles are live, how many are still sitting in
 * draft, and what was changed recently.
 */

export default async function ShopOverview() {
  const payload = await getPayload({ config });

  const [published, draftDocs, media, recent] = await Promise.all([
    payload.count({
      collection: "products",
      where: { _status: { equals: "published" } },
    }),
    // count() has no draft option, so drafts are counted from a query.
    payload.find({
      collection: "products",
      where: { _status: { equals: "draft" } },
      draft: true,
      limit: 1,
      depth: 0,
      pagination: false,
    }).then((r) => ({ totalDocs: r.totalDocs })),
    payload.count({ collection: "media" }),
    payload.find({
      collection: "products",
      sort: "-updatedAt",
      limit: 5,
      depth: 0,
      draft: true,
      select: { name: true, slug: true, category: true, updatedAt: true, _status: true },
    }),
  ]);
  const drafts = draftDocs;

  const stat = (label: string, value: number, href: string, tone?: string) => (
    <Link
      key={label}
      href={href}
      style={{
        display: "block",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "4px",
        background: "var(--theme-elevation-50)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: "1.75rem", fontWeight: 500, color: tone }}>{value}</div>
      <div style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
    </Link>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Shop overview</h2>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
          What is live on the website right now.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}
      >
        {stat("Styles live", published.totalDocs, "/admin/collections/products")}
        {stat(
          drafts.totalDocs > 0 ? "Waiting to publish" : "Waiting to publish",
          drafts.totalDocs,
          "/admin/collections/products?status=draft",
          drafts.totalDocs > 0 ? "var(--theme-success-450)" : undefined,
        )}
        {stat("Photographs", media.totalDocs, "/admin/collections/media")}
      </div>

      {drafts.totalDocs > 0 ? (
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          {drafts.totalDocs === 1
            ? "One style is saved as a draft, so customers cannot see it yet. Open it and press Save & Publish when it is ready."
            : `${drafts.totalDocs} styles are saved as drafts, so customers cannot see them yet. Open each one and press Save & Publish when it is ready.`}
        </p>
      ) : null}

      {recent.docs.length ? (
        <div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
            Changed recently
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.4rem" }}>
            {recent.docs.map((doc) => (
              <li key={doc.id} style={{ fontSize: "0.875rem" }}>
                <Link
                  href={`/admin/collections/products/${doc.id}`}
                  style={{ color: "var(--theme-success-500)" }}
                >
                  {doc.name || doc.category}
                </Link>
                {doc._status === "draft" ? (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", opacity: 0.7 }}>
                    draft
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}