import type { Money } from "@/lib/format";

/** Fields every product listing needs. Shared by the GraphQL fragment and the mapper. */
export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCard on Product {
    handle
    title
    productType
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variantsCount {
      count
    }
    family: metafield(namespace: "custom", key: "family") {
      value
    }
    intensity: metafield(namespace: "custom", key: "intensity") {
      value
    }
  }
`;

export type ProductCardNode = {
  handle: string;
  title: string;
  productType: string;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
  priceRange: { minVariantPrice: Money };
  variantsCount: { count: number } | null;
  family: { value: string } | null;
  intensity: { value: string } | null;
};

export type ProductCard = {
  handle: string;
  title: string;
  productType: string;
  availableForSale: boolean;
  image: { url: string; alt: string; width: number; height: number } | null;
  price: Money;
  /** True when variants have different prices, so the card says "From $38". */
  hasPriceRange: boolean;
  family: string | null;
  intensity: 1 | 2 | 3 | null;
};

function parseIntensity(value: string | undefined): ProductCard["intensity"] {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

export function toProductCard(node: ProductCardNode): ProductCard {
  return {
    handle: node.handle,
    title: node.title,
    productType: node.productType,
    availableForSale: node.availableForSale,
    image: node.featuredImage
      ? {
          url: node.featuredImage.url,
          alt: node.featuredImage.altText || node.title,
          width: node.featuredImage.width,
          height: node.featuredImage.height,
        }
      : null,
    price: node.priceRange.minVariantPrice,
    hasPriceRange: (node.variantsCount?.count ?? 1) > 1,
    family: node.family?.value ?? null,
    intensity: parseIntensity(node.intensity?.value),
  };
}
