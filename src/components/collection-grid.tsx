"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product-card";
import { type Product } from "@/lib/cms";

type Sort = "featured" | "new" | "name";

/**
 * The catalogue is fetched on the server and handed down as props. A client
 * component cannot reach the database, and this keeps the filters and sorting
 * instant without another round trip.
 */
type Props = {
  products: Product[];
  categories: string[];
  fabrics: string[];
  occasions: string[];
  initialCategory?: string;
};

const sorts: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "name", label: "Name: A to Z" },
];

function sortProducts(list: Product[], sort: Sort) {
  const copy = [...list];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "new":
      return copy.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
    default:
      return copy.sort(
        (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false),
      );
  }
}

export default function CollectionGrid({
  products,
  categories,
  fabrics,
  occasions,
  initialCategory,
}: Props) {
  const [category, setCategory] = useState<string>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : "All",
  );
  const [fabric, setFabric] = useState<string>("All");
  const [occasion, setOccasion] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("featured");

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (fabric !== "All" && p.fabric !== fabric) return false;
      if (occasion !== "All" && !p.occasions.includes(occasion as never)) return false;
      return true;
    });
    list = sortProducts(list, sort);
    return list;
  }, [products, category, fabric, occasion, sort]);

  const hasFilters = category !== "All" || fabric !== "All" || occasion !== "All";

  function reset() {
    setCategory("All");
    setFabric("All");
    setOccasion("All");
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line bg-sand/60 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[0.6875rem] uppercase tracking-[0.18em] text-ink-soft">
            Type
          </span>
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                category === c
                  ? "border-clay bg-clay text-linen"
                  : "border-line bg-white text-ink-soft hover:border-clay hover:text-clay"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Fabric
            <select
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="field w-auto py-1.5 text-xs"
            >
              <option value="All">All fabrics</option>
              {fabrics.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Wear
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="field w-auto py-1.5 text-xs"
            >
              <option value="All">All occasions</option>
              {occasions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="field w-auto py-1.5 text-xs"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-ink-soft">
          Showing {filtered.length} of {products.length} styles
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="text-xs uppercase tracking-[0.14em] text-clay hover:text-clay-dark"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 border border-line bg-white p-12 text-center">
          <p className="font-display text-2xl">No styles match those filters</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            We make more than we list here. Message us on WhatsApp with what you are looking for and
            we will tell you what we can make this week.
          </p>
          <button type="button" onClick={reset} className="btn btn-outline mt-6">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={products.indexOf(p)} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}