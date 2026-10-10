import Link from "next/link";
import ProductCard from "@/components/product-card";
import ProductImage from "@/components/product-image";
import { getAllCategories, getFeaturedProducts, getProducts, getSettings, getSocialPosts } from "@/lib/cms";
import { bulkWhatsappUrl, generalWhatsappUrl, visitWhatsappUrl } from "@/lib/whatsapp";
import InstagramFeed from "@/components/instagram-feed";

/**
 * Rendered on demand. The featured row comes from the database, so prerendering
 * at build time would freeze whichever styles happened to be published when the
 * build ran.
 */
export const dynamic = "force-dynamic";

const trustPoints = [
  {
    title: "Our own workshop",
    body: "Cutting, stitching, embroidery and finishing happen under one roof. No middlemen, no outsourced QC.",
  },
  {
    title: "Jumbo sizes included",
    body: "S through 3XL on core styles. We alter to measure on request before dispatch.",
  },
  {
    title: "Ships across India",
    body: "Dispatched from Ahmedabad within 3 working days. Cash on delivery available on many pin codes.",
  },
  {
    title: "Small MOQs",
    body: "Single pieces welcome. Retailers and event clients get wholesale rates from 20 pieces.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Fabric sourcing",
    body: "We buy directly from Ahmedabad and Surat mills, so no broker margin is baked into your price.",
  },
  {
    step: "02",
    title: "Pattern and cutting",
    body: "Patterns are graded across the full size range before a single piece is cut, so every size drapes the same.",
  },
  {
    step: "03",
    title: "Stitching and finishing",
    body: "In-house stitching, then pressing, thread trimming, and a final inspection on every unit before it is folded.",
  },
  {
    step: "04",
    title: "Packed and shipped",
    body: "Folded, poly-wrapped and dispatched. You get the same piece you would have picked off our store rack.",
  },
];

export default async function HomePage() {
  const [featured, allProducts, categories, settings, socialPosts] = await Promise.all([
    getFeaturedProducts(),
    getProducts(),
    getAllCategories(),
    getSettings(),
    getSocialPosts(6),
  ]);
  const samples = [...allProducts]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);
  const styleCount = allProducts.length;

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-linen">
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F3EFFA 0px, #F3EFFA 1px, transparent 1px, transparent 9px)",
            }}
          />
        </div>

        <div className="wrap relative grid gap-12 py-20 md:grid-cols-[1.15fr_1fr] md:items-center md:py-28">
          <div>
            <p className="eyebrow text-saffron">Kurti manufacture &middot; {settings.city}</p>
            <h1 className="display mt-5 text-5xl md:text-6xl lg:text-7xl">
              Kurtis made in our own
              <span className="block italic text-saffron">Ahmedabad workshop.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-linen/70 md:text-lg">
              You do not need to travel to our store to know what we make. Browse the kurtis we cut
              and stitch every day, check the fabric and size details yourself, and order wherever
              you are in India.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/collection" className="btn btn-primary">
                Browse the collection
              </Link>
              <a href={generalWhatsappUrl(undefined, settings.whatsapp)} className="btn btn-ghost-light">
                Order on WhatsApp
              </a>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
              <div>
                <dt className="font-display text-3xl text-saffron">12+</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-linen/55">
                  Styles in stock
                </dd>
              </div>
              <div>
                <dt className="font-display text-3xl text-saffron">S&ndash;3XL</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-linen/55">
                  Size range
                </dd>
              </div>
              <div>
                <dt className="font-display text-3xl text-saffron">20+</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-linen/55">
                  Bulk order minimum
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((p, i) => (
              <Link
                key={p.slug}
                href={`/collection/${p.slug}`}
                className={`group relative overflow-hidden ${i === 0 ? "aspect-3/4 col-span-2 row-span-2" : "aspect-3/4"}`}
              >
                <ProductImage
                  src={p.image}
                  alt={p.shortNote || p.category}
                  seed={i}
                  label={p.category}
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(min-width: 768px) 25vw, 50vw"
                  priority={i < 4}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-10">
                  <p className="font-display text-lg text-linen">
                    {p.name || p.category}
                  </p>
                  {p.fabric ? (
                    <p className="text-xs text-saffron">{p.fabric}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">This season&rsquo;s picks</h2>
          </div>
          <Link
            href="/collection"
            className="text-xs uppercase tracking-[0.16em] text-clay transition-colors hover:text-clay-dark"
          >
            View all {styleCount} styles &rarr;
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="bg-sand py-20 md:py-28">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="eyebrow">Why buy from the manufacturer</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              One workshop, no middle layer
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Most online kurti sellers buy ready-made stock from a trading market and resell it. We
              cut and stitch the kurtis ourselves, so you see the same range whether you walk into
              our Ahmedabad store or order from another state.
            </p>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {trustPoints.map((t) => (
              <div key={t.title} className="border-t border-line pt-5">
                <h3 className="font-display text-xl text-ink">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-20 md:py-28">
        <p className="eyebrow">How it is made</p>
        <h2 className="display mt-3 max-w-xl text-4xl md:text-5xl">
          Fabric to finished kurti in four steps
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {processSteps.map((s) => (
            <div key={s.step}>
              <span className="font-display text-4xl text-clay/30">{s.step}</span>
              <h3 className="mt-2 font-display text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>

        <Link href="/craft" className="btn btn-outline mt-12">
          Read our full process
        </Link>
      </section>

      <section className="wrap pb-20 md:pb-28">
        <p className="eyebrow">Shop by type</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Link
              key={c}
              href={`/collection?category=${encodeURIComponent(c)}`}
              className="group flex items-center justify-between border border-line bg-white px-4 py-4 transition-colors hover:border-clay"
            >
              <span className="font-display text-lg text-ink">{c}</span>
              <span className="text-xs text-ink-soft transition-colors group-hover:text-clay">
                {String(i + 1).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-maroon text-linen">
        <div className="wrap grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
          <div>
            <p className="eyebrow text-saffron">Retailers &amp; event clients</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              Need kurtis in bulk?
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-linen/70">
              Wholesale pricing from 20 pieces, custom sizes, your own fabric or print, and private
              labelling. Tell us your quantity and delivery date and we will send a rate card.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={bulkWhatsappUrl(settings.whatsapp)} className="btn btn-primary">
                Request rate card
              </a>
              <Link href="/bulk" className="btn btn-ghost-light">
                Bulk order details
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {samples.map((p) => (
              <Link
                key={p.slug}
                href={`/collection/${p.slug}`}
                className="flex items-center gap-4 border-b border-white/15 pb-4 last:border-0"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden">
                  <ProductImage
                    src={p.image}
                    alt={p.shortNote || p.category}
                    seed={allProducts.indexOf(p)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base">
                    {p.name || p.category}
                  </p>
                  {p.fabric ? <p className="text-xs text-linen/55">{p.fabric}</p> : null}
                </div>
              </Link>
            ))}
            <p className="pt-2 text-xs text-linen/50">
              A sample of what we make. Rate cards are sent on request, based on quantity, fabric and
              delivery date.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Based in {settings.city}</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              Come see the fabric in person
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              If you are in Ahmedabad, the store is the fastest way to understand a kurti. You can
              touch the fabric, check the stitching and confirm the fit. If you are not, send us a
              WhatsApp and we will share photos and measurements of anything you shortlist.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/visit" className="btn btn-primary">
                Store address &amp; timings
              </Link>
              <a href={visitWhatsappUrl(settings.whatsapp, settings.city)} className="btn btn-outline">
                Ask on WhatsApp
              </a>
            </div>
          </div>

          <dl className="grid gap-px bg-line sm:grid-cols-2">
            {[
              { label: "Address", value: settings.addressLines.join(", ") },
              { label: "Timings", value: "Mon&ndash;Sat, 10:30 AM &ndash; 8:30 PM" },
              { label: "Closed", value: "Sundays and public holidays" },
              { label: "Phone", value: settings.phone },
            ].map((item) => (
              <div key={item.label} className="bg-white p-6">
                <dt className="eyebrow">{item.label}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <InstagramFeed posts={socialPosts} handle={settings.instagram} url={settings.instagramUrl} />
    </>
  );
}