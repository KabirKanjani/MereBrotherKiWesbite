import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import CollectionGrid from "@/components/collection-grid";
import { generalWhatsappUrl } from "@/lib/whatsapp";
import { getAllCategories, getAllFabrics, getAllOccasions, getProducts } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Kurti Collection",
  description:
    "Browse every kurti, kurti pant set, dupatta set, co-ord and skirt set made in our Ahmedabad workshop. Filter by fabric, occasion and size.",
  alternates: { canonical: "/collection" },
};

/** Read on demand, so a newly published style shows up without a redeploy. */
export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [params, products, categories, fabrics, occasions] = await Promise.all([
    searchParams,
    getProducts(),
    getAllCategories(),
    getAllFabrics(),
    getAllOccasions(),
  ]);
  const initialCategory =
    typeof params.category === "string" ? params.category : undefined;

  return (
    <div className="wrap py-14 md:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="display mt-3 text-4xl md:text-6xl">
          Every kurti we currently make
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          What you see here is what sits on our store floor in{" "}
          <span className="font-medium text-ink">Ahmedabad</span> today. Filter by type, fabric or
          occasion. Sizes run S to 3XL, and we can alter to your measurements before dispatch.
        </p>
      </div>

      <div className="mt-10">
        <Suspense fallback={<div className="h-96 animate-pulse bg-sand" />}>
          <CollectionGrid
            products={products}
            categories={categories}
            fabrics={fabrics}
            occasions={occasions}
            initialCategory={initialCategory}
          />
        </Suspense>
      </div>

      <div className="mt-16 border border-line bg-sand p-8 text-center md:p-12">
        <h2 className="display text-3xl md:text-4xl">Cannot find what you had in mind?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
          Most of our production runs off this list. Tell us the length, fabric and quantity you
          want and we will send you options we can make for you.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/bulk" className="btn btn-primary">
            Bulk &amp; custom orders
          </Link>
          <a href={generalWhatsappUrl()} className="btn btn-outline">
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}