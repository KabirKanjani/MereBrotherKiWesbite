import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product-card";
import { getProductsInSeason, getSeason, getSeasons, getSettings } from "@/lib/cms";

/** Read on demand, so a new season appears without a redeploy. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [season, settings] = await Promise.all([getSeason(slug), getSettings()]);

  if (!season) return { title: "Collection not found" };

  const title = season.seoTitle || season.title;

  return {
    title: `${title} | ${settings.name}`,
    description: season.seoDescription || season.summary || `Shop ${season.title} from ${settings.name}.`,
    alternates: { canonical: `/seasons/${season.slug}` },
    openGraph: {
      title: `${title} | ${settings.name}`,
      description: season.summary || undefined,
      url: `${settings.url}/seasons/${season.slug}`,
      images: season.heroImage ? [{ url: season.heroImage }] : undefined,
    },
  };
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [season, products, settings, allSeasons] = await Promise.all([
    getSeason(slug),
    getProductsInSeason(slug),
    getSettings(),
    getSeasons(),
  ]);

  if (!season) notFound();

  const isEmpty = products.length === 0;

  // Breadcrumb structured data, so Google can show the path in results.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: settings.url },
      { "@type": "ListItem", position: 2, name: "Seasons", item: `${settings.url}/seasons` },
      { "@type": "ListItem", position: 3, name: season.title, item: `${settings.url}/seasons/${season.slug}` },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: season.title,
    description: season.summary || undefined,
    url: `${settings.url}/seasons/${season.slug}`,
  };

  const others = allSeasons.filter((s) => s.slug !== season.slug).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <section className={season.heroImage ? "relative isolate overflow-hidden" : "bg-ink text-linen"}>
        {season.heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={season.heroImage}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-ink/60" />
          </>
        ) : null}

        <div className="wrap py-16 md:py-24">
          {season.seasonLabel ? (
            <p className="eyebrow text-saffron">{season.seasonLabel}</p>
          ) : (
            <p className="eyebrow text-saffron">This season</p>
          )}

          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            {season.bannerText || season.title}
          </h1>

          {season.summary ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-linen/75 md:text-lg">
              {season.summary}
            </p>
          ) : null}

          <nav aria-label="Breadcrumb" className="mt-6 text-xs text-linen/60">
            <Link href="/" className="hover:text-linen">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/seasons" className="hover:text-linen">
              Seasons
            </Link>
            <span className="mx-2">/</span>
            <span className="text-linen">{season.title}</span>
          </nav>
        </div>
      </section>

      <section className="wrap py-14 md:py-20">
        {isEmpty ? (
          <p className="max-w-2xl leading-relaxed text-ink-soft">
            This season is being photographed. Styles will appear here shortly — in the meantime
            everything we currently make is on the{" "}
            <Link href="/collection" className="text-clay underline">
              collection page
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">In this season</p>
                <h2 className="display mt-3 text-3xl md:text-4xl">
                  {products.length} {products.length === 1 ? "style" : "styles"}
                </h2>
              </div>
              <Link
                href="/enquiry"
                className="text-xs uppercase tracking-[0.16em] text-clay transition-colors hover:text-clay-dark"
              >
                Enquire about this season &rarr;
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </>
        )}
      </section>

      {others.length ? (
        <section className="bg-sand py-14 md:py-20">
          <div className="wrap">
            <p className="eyebrow">Other seasons</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((s) => (
                <Link
                  key={s.id}
                  href={`/seasons/${s.slug}`}
                  className="group bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
                >
                  {s.seasonLabel ? (
                    <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-clay">
                      {s.seasonLabel}
                    </p>
                  ) : null}
                  <p className="mt-2 font-display text-xl text-ink group-hover:text-clay">
                    {s.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}