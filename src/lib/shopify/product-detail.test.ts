import { describe, expect, it } from "vitest";
import { toProductDetail, type ProductDetailNode } from "./product-detail";

const note = (handle: string, name: string, group: string) => ({
  handle,
  name: { value: name },
  group: { value: group },
  description: { value: `${name} description` },
});

const base: ProductDetailNode = {
  id: "gid://shopify/Product/1",
  handle: "quoin",
  title: "Quoin",
  productType: "Eau de Parfum",
  description: "The cornerstone that locks two walls together.",
  descriptionHtml: "<p>The cornerstone that locks two walls together.</p>",
  availableForSale: true,
  seo: { title: null, description: null },
  featuredImage: { url: "https://cdn.shopify.com/s/files/quoin.jpg", altText: null, width: 1792, height: 2400 },
  variants: {
    nodes: [
      { id: "v10", title: "10 ml", sku: "TSL-QUO-10", availableForSale: true, price: { amount: "38.0", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "10 ml" }], burnTime: null },
      { id: "v100", title: "100 ml", sku: "TSL-QUO-100", availableForSale: false, price: { amount: "195.0", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "100 ml" }], burnTime: null },
    ],
  },
  family: { value: "Amber" },
  intensity: { value: "3" },
  seasons: { value: '["Autumn","Winter"]' },
  occasions: { value: '["Evening"]' },
  longevity: { value: "Very long-lasting" },
  sillage: { value: "Strong" },
  concentration: { value: "Eau de parfum" },
  packaging: null,
  materials: null,
  howToUse: null,
  durationWeeks: null,
  topNotes: { references: { nodes: [note("saffron", "Saffron", "Spicy")] } },
  heartNotes: { references: { nodes: [note("rose", "Rose", "Floral")] } },
  baseNotes: { references: { nodes: [note("amber", "Amber", "Amber"), note("x", "Mystery", "Unknown")] } },
  notes: null,
  includes: null,
};

describe("toProductDetail", () => {
  it("maps a perfume: sizes, profile, pyramid", () => {
    const p = toProductDetail(base);
    expect(p.optionName).toBe("Size");
    expect(p.variants.map((v) => [v.option, v.availableForSale])).toEqual([
      ["10 ml", true],
      ["100 ml", false],
    ]);
    expect(p.intensity).toBe(3);
    expect(p.seasons).toEqual(["Autumn", "Winter"]);
    expect(p.pyramid.top[0]).toEqual({ handle: "saffron", name: "Saffron", group: "Spicy", description: "Saffron description" });
    expect(p.pyramid.base[1].group).toBeNull();
    expect(p.seo).toEqual({ title: "Quoin", description: "The cornerstone that locks two walls together." });
    expect(p.image?.alt).toBe("Quoin");
  });

  it("maps single-variant products and multi-line text fields", () => {
    const p = toProductDetail({
      ...base,
      productType: "Diffuser",
      variants: {
        nodes: [{ ...base.variants.nodes[0], title: "Default Title", selectedOptions: [{ name: "Title", value: "Default Title" }] }],
      },
      materials: { value: "200 ml fragrance\n8 rattan reeds\n" },
      durationWeeks: { value: "12" },
      seasons: { value: "not json" },
    });
    expect(p.optionName).toBeNull();
    expect(p.variants[0].option).toBeNull();
    expect(p.materials).toEqual(["200 ml fragrance", "8 rattan reeds"]);
    expect(p.durationWeeks).toBe(12);
    expect(p.seasons).toEqual([]);
  });

  it("reads candle burn time per variant", () => {
    const p = toProductDetail({
      ...base,
      variants: { nodes: [{ ...base.variants.nodes[0], burnTime: { value: "40" } }] },
    });
    expect(p.variants[0].burnTimeHours).toBe(40);
  });
});
