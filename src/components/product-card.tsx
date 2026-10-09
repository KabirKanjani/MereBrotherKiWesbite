import Link from "next/link";
import ProductImage from "@/components/product-image";
import { type Product } from "@/lib/cms";

type Props = {
  product: Product;
  index?: number;
  priority?: boolean;
};

/**
 * A photo card with no product name attached.
 *
 * The shop has not named these styles yet, so showing a guessed name would
 * misdescribe the garment in the photograph. The category comes from the
 * Instagram caption, so it is safe to show.
 */
export default function ProductCard({ product, index = 0, priority = false }: Props) {
  return (
    <Link
      href={`/collection/${product.slug}`}
      className="group card-hover block bg-white"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-sand">
        <ProductImage
          src={product.image}
          alt={product.shortNote || `Kivia Designs ${product.category}`}
          seed={index}
          priority={priority}
          fabric={product.fabric ?? undefined}
          label={product.isNew ? "New in" : product.category}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        />
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-clay">
            {product.category}
          </p>
          {product.sizes.length ? (
            <p className="mt-1 text-xs text-ink-soft">Sizes {product.sizes.join(", ")}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-[0.6875rem] uppercase tracking-[0.16em] text-clay opacity-0 transition-opacity group-hover:opacity-100">
          View
        </span>
      </div>
    </Link>
  );
}