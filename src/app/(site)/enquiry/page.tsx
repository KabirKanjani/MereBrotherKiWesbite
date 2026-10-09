import type { Metadata } from "next";
import { Suspense } from "react";
import EnquiryForm from "@/components/enquiry-form";
import { getProducts, getSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Enquire",
  description:
    "Send an enquiry to Kivia Designs in Ahmedabad about a kurti, a bulk order or custom tailoring. We reply on WhatsApp during store hours.",
  alternates: { canonical: "/enquiry" },
};

export const dynamic = "force-dynamic";

export default async function EnquiryPage({
  searchParams,
}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [params, products, settings] = await Promise.all([
    searchParams,
    getProducts(),
    getSettings(),
  ]);
  const raw = typeof params.product === "string" ? params.product : undefined;
  const found = raw ? products.find((p) => p.slug === raw) : undefined;
  const product = found ? found.slug : undefined;

  return (
    <div className="wrap py-14 md:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Enquire</p>
        <h1 className="display mt-3 text-4xl md:text-6xl">
          {found ? `Ask about ${found.name || found.category}` : "Tell us what you need"}
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          Fill this in and it will open WhatsApp with everything already written out. Send it and
          we will come back to you with stock, pricing and a delivery date. If you would rather not
          fill a form, just message us directly.
        </p>
      </div>

      <div className="mt-12">
        <Suspense fallback={<div className="h-96 animate-pulse bg-sand" />}>
          <EnquiryForm
            presetProduct={product}
            products={products}
            shopName={settings.name}
            shopPhone={settings.phone}
            shopCity={settings.city}
            shopEmail={settings.email}
          />
        </Suspense>
      </div>
    </div>
  );
}