import { describe, expect, it } from "vitest";
import { toProductCard, type ProductCardNode } from "./products";

const node: ProductCardNode = {
  handle: "quoin",
  title: "Quoin",
  productType: "Eau de Parfum",
  availableForSale: true,
  featuredImage: { url: "https://cdn.shopify.com/s/files/quoin.jpg", altText: "Quoin by Tessel", width: 1792, height: 2400 },
  priceRange: { minVariantPrice: { amount: "38.0", currencyCode: "USD" } },
  variantsCount: { count: 3 },
  family: { value: "Amber" },
  intensity: { value: "3" },
};

describe("toProductCard", () => {
  it("maps a perfume with family, intensity and a price range", () => {
    expect(toProductCard(node)).toEqual({
      handle: "quoin",
      title: "Quoin",
      productType: "Eau de Parfum",
      availableForSale: true,
      image: { url: "https://cdn.shopify.com/s/files/quoin.jpg", alt: "Quoin by Tessel", width: 1792, height: 2400 },
      price: { amount: "38.0", currencyCode: "USD" },
      hasPriceRange: true,
      family: "Amber",
      intensity: 3,
    });
  });

  it("handles products without metafields, image alt or variants", () => {
    const card = toProductCard({
      ...node,
      featuredImage: { ...node.featuredImage!, altText: null },
      variantsCount: { count: 1 },
      family: null,
      intensity: null,
    });
    expect(card.image?.alt).toBe("Quoin");
    expect(card.hasPriceRange).toBe(false);
    expect(card.family).toBeNull();
    expect(card.intensity).toBeNull();
  });

  it("ignores intensity values outside 1–3", () => {
    expect(toProductCard({ ...node, intensity: { value: "7" } }).intensity).toBeNull();
    expect(toProductCard({ ...node, featuredImage: null }).image).toBeNull();
  });
});
