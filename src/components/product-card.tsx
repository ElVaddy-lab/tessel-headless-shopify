import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/lib/shopify/products";
import { IntensityScale } from "./intensity-scale";

type Props = {
  product: ProductCardData;
  /** `sizes` for next/image; depends on the grid the card sits in. */
  sizes: string;
  /** Short label under the title; defaults to fragrance family or product type. */
  kicker?: string;
  priority?: boolean;
};

export function ProductCard({ product, sizes, kicker, priority = false }: Props) {
  const price = formatPrice(product.price);
  const subtitle = kicker ?? product.family ?? product.productType;

  return (
    <Link href={`/products/${product.handle}`} className="group flex h-full flex-col bg-paper p-3 sm:p-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-wall">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={sizes}
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            className="object-cover transition-opacity duration-200"
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-1">
        <h3 className="text-lg leading-tight font-medium underline-offset-4 group-hover:underline sm:text-xl">
          {product.title}
        </h3>
        <p className="label text-muted">
          {subtitle} · {product.hasPriceRange ? `From ${price}` : price}
        </p>
        {product.intensity ? (
          <div className="mt-2">
            <IntensityScale value={product.intensity} />
          </div>
        ) : null}
        {!product.availableForSale ? <p className="label mt-2 text-ink">Sold out</p> : null}
      </div>
    </Link>
  );
}
