import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/product-image";
import ProductCard from "@/components/product-card";
import { getProduct, getProducts, getRelatedProducts, getSettings } from "@/lib/cms";
import { productWhatsappUrl } from "@/lib/whatsapp";

/**
 * Styles come from the database, so this route is rendered on demand rather than
 * at build time. That is what lets an editor publish a new style and have it
 * appear without a redeploy.
 */
export const dynamic = "force-dynamic";

type SlugProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: SlugProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, shop] = await Promise.all([getProduct(slug), getSettings()]);

  if (!product) {
    return { title: "Product not found" };
  }

  const title = product.name || `${product.category} by ${shop.name}`;

  return {
    title: product.fabric ? `${title} — ${product.fabric}` : title,
    description: `${product.shortNote} Sizes ${
      product.sizes.length ? product.sizes.join(", ") : "on request"
    }. Bulk orders from 20 pieces.`,
    alternates: { canonical: `/collection/${product.slug}` },
    openGraph: {
      title: `${title} | ${shop.name}`,
      description: product.shortNote,
      type: "website",
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: SlugProps) {
  const { slug } = await params;
  const [product, allProducts, shop] = await Promise.all([
    getProduct(slug),
    getProducts(),
    getSettings(),
  ]);

  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const index = allProducts.indexOf(product);

  /*
   * Product structured data.
   *
   * No `offers` block is emitted, and that is deliberate. This shop sells in
   * bulk at agreed rates rather than at a fixed retail price, so publishing an
   * invented price or a misleading "in stock" claim would be worse than saying
   * nothing. Google shows the image, name and description without it.
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.category,
    description: product.shortNote || undefined,
    image: product.image ? [`${shop.url}${product.image}`] : undefined,
    category: product.category,
    material: product.fabric || undefined,
    brand: { "@type": "Brand", name: shop.name },
    url: `${shop.url}/collection/${product.slug}`,
    ...(product.seasonTitle ? { isRelatedTo: { "@type": "CollectionPage", name: product.seasonTitle } } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: shop.url },
      { "@type": "ListItem", position: 2, name: "Collection", item: `${shop.url}/collection` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name || product.category,
        item: `${shop.url}/collection/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="wrap py-10 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-soft">
        <Link href="/" className="hover:text-clay">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/collection" className="hover:text-clay">
          Collection
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.category}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-3/4 overflow-hidden bg-sand">
            <ProductImage
              src={product.image}
              alt={`Kivia Designs ${product.category}`}
              seed={index}
              label={product.category}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Photograph taken at our {shop.city} workshop. Message us on WhatsApp and we will send
            current stock, colours and close-ups of this style.
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{product.category}</span>
            {product.isNew ? (
              <span className="bg-clay px-2 py-1 text-[0.625rem] uppercase tracking-[0.14em] text-linen">
                New in
              </span>
            ) : null}
          </div>

          <h1 className="display mt-3 text-4xl md:text-5xl">
            {product.name || `${product.category} from our workshop`}
          </h1>
          {product.fabric ? (
            <p className="mt-2 text-sm uppercase tracking-[0.14em] text-ink-soft">
              {product.fabric}
            </p>
          ) : null}

          <div className="mt-5 border border-clay/30 bg-sand/60 px-4 py-3">
            <p className="text-sm text-ink">
              We supply in bulk only, from 20 pieces per style.
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Rate cards depend on quantity, fabric and delivery date. Ask for this style and we will
              send pricing for your order.
            </p>
          </div>

          <p className="mt-6 leading-relaxed text-ink-soft">{product.shortNote}</p>

          <div className="mt-8 space-y-6 border-y border-line py-6">
            {product.sizes.length ? (
              <div>
                <h2 className="label">Sizes</h2>
                <ul className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <li
                      key={s}
                      className="border border-line bg-white px-3 py-1.5 text-xs text-ink"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-soft">
                  Measurements are on the{" "}
                  <Link href="/size-guide" className="text-clay underline">
                    size guide
                  </Link>
                  . We can alter to your measurements at no extra cost.
                </p>
              </div>
            ) : null}

            {product.work ? (
              <div>
                <h2 className="label">Work</h2>
                <p className="text-sm text-ink-soft">{product.work}</p>
              </div>
            ) : null}

            <div>
              <h2 className="label">See it on Instagram</h2>
              <a
                href={product.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-clay underline"
              >
                View the original post
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={productWhatsappUrl(product, shop.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex-1"
            >
              Order on WhatsApp
            </a>
            <Link href={`/enquiry?product=${product.slug}`} className="btn btn-outline flex-1">
              Send enquiry
            </Link>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            We confirm stock and delivery time on WhatsApp. Dispatched from {shop.city} within 3
            working days.
          </p>

          <div className="mt-10 space-y-6">
            <div>
              <h2 className="font-display text-xl text-ink">Details</h2>
              <ul className="mt-3 space-y-2">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-2 h-px w-3 shrink-0 bg-clay" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink">Care</h2>
              <ul className="mt-3 space-y-2">
                {product.care.map((c) => (
                  <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-2 h-px w-3 shrink-0 bg-clay" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24 border-t border-line pt-14">
          <h2 className="display text-3xl md:text-4xl">You may also like</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} index={allProducts.indexOf(p)} />
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </>
  );
}