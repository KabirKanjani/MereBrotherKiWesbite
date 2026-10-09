import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/cms";
import { generalWhatsappUrl, visitWhatsappUrl } from "@/lib/whatsapp";

/**
 * The store address was the one detail most likely to change and the hardest to
 * change, sitting in code as a placeholder. It is read from the CMS instead.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Visit Our ${settings.city} Store`,
    description: `Address, timings and directions for the ${settings.name} kurti store in ${settings.city}. See the fabric in person before you order.`,
    alternates: { canonical: "/visit" },
  };
}

const whatToExpect = [
  {
    title: "Touch the fabric",
    body: "Every fabric we use is available as a sample in the store. Hold it, check the weight against what you ordered online.",
  },
  {
    title: "Try the fit",
    body: "Full range on the rail, S to 3XL. Try with the shoes and inner you would wear so the length reads correctly.",
  },
  {
    title: "Customise on the spot",
    body: "Want a different length, a heavier lining, or a colour you cannot see on screen? We can usually sort it before you leave.",
  },
  {
    title: "Order remotely if you like",
    body: "Fell in love with something in store but you live out of town? Ask us to ship it and pay by WhatsApp.",
  },
];

const directions = [
  {
    title: "By road",
    body: "We are in Ahmedabad city. Call or WhatsApp us before you travel and we will share the exact shop location on a pin, plus the nearest landmark and parking.",
  },
  {
    title: "Out of town visitors",
    body: "Travelling through Ahmedabad? Message us your date a day ahead and we will keep your preferred sizes aside so you are not browsing against a wall.",
  },
];

export default async function VisitPage() {
  const site = await getSettings();

  return (
    <>
      <section className="bg-ink text-linen">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow text-saffron">Visit us</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            Come see the fabric yourself
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-linen/70">
            If you are in {site.city}, the store is the fastest way to understand what we make.
            You can touch the fabric, try the fit, and confirm the stitching without any of the
            guesswork that comes with ordering from another city.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={visitWhatsappUrl(site.whatsapp, site.city)} className="btn btn-primary">
              Get the exact location
            </a>
            <a href={generalWhatsappUrl(undefined, site.whatsapp)} className="btn btn-ghost-light">
              Ask a question
            </a>
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="display text-3xl md:text-4xl">Where we are</h2>
            <address className="mt-6 not-italic">
              <p className="font-display text-2xl text-ink">{site.name}</p>
              <p className="mt-3 leading-relaxed text-ink-soft">
                {site.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                <span className="block">
                  {site.city}, {site.region}, {site.country}
                </span>
              </p>
            </address>

            <div className="mt-8 border-l-2 border-clay bg-sand p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-clay">Address to confirm</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                This is a placeholder address. Message us on WhatsApp and we will send the exact
                shop location with a pin, before you travel.
              </p>
            </div>

            <dl className="mt-10 space-y-5">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-6 border-b border-line pb-4">
                  <dt className="text-sm text-ink-soft">{h.days}</dt>
                  <dd className="text-sm text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:${site.phone}`} className="btn btn-outline">
                Call {site.phone}
              </a>
              <a href={visitWhatsappUrl(site.whatsapp, site.city)} className="btn btn-primary">
                WhatsApp for directions
              </a>
            </div>
          </div>

          <div>
            <h2 className="display text-3xl md:text-4xl">What to expect in store</h2>
            <div className="mt-6 space-y-px bg-line">
              {whatToExpect.map((w) => (
                <div key={w.title} className="bg-linen py-5">
                  <h3 className="font-display text-xl text-ink">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{w.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-8">
              {directions.map((d) => (
                <div key={d.title}>
                  <h3 className="font-display text-lg text-ink">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="wrap">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "In Ahmedabad?",
                body: "Visit the store. There is nothing a photo or a fabric description can tell you that handling the cloth will.",
                cta: { href: visitWhatsappUrl(site.whatsapp, site.city), label: "Get directions" },
              },
              {
                title: "Elsewhere in India?",
                body: "Order online or over WhatsApp. We ship everywhere, and we will send you photos and measurements of anything you shortlist.",
                cta: { href: "/collection", label: "Browse the collection" },
              },
              {
                title: "Buying in bulk?",
                body: "Come in and look at the fabric swatches, or we can send you a sample pack by courier anywhere in India.",
                cta: { href: "/bulk", label: "Bulk order details" },
              },
            ].map((c) => (
              <div key={c.title} className="bg-white p-6">
                <h2 className="font-display text-xl text-ink">{c.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                <Link
                  href={c.cta.href.startsWith("/") ? c.cta.href : "/visit"}
                  className="mt-5 inline-block text-xs uppercase tracking-[0.14em] text-clay hover:text-clay-dark"
                >
                  {c.cta.label} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}