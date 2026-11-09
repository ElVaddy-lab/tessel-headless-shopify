import { describe, expect, it } from "vitest";
import {
  catalogHref,
  countActiveFilters,
  filterGroupsForView,
  parseCatalogParams,
  slugify,
  toProductFilters,
  type StorefrontFilter,
} from "./catalog-params";

const filters: StorefrontFilter[] = [
  {
    id: "filter.p.m.custom.family",
    label: "Family",
    values: [
      { label: "Woody", count: 2, input: '{"productMetafield":{"namespace":"custom","key":"family","value":"Woody"}}' },
      { label: "Amber", count: 2, input: '{"productMetafield":{"namespace":"custom","key":"family","value":"Amber"}}' },
    ],
  },
  {
    id: "filter.p.m.custom.notes",
    label: "Notes",
    values: [
      { label: "Fig leaf", count: 1, input: '{"productMetafield":{"namespace":"custom","key":"notes","value":"gid://shopify/Metaobject/1"}}' },
      { label: "Vanilla", count: 2, input: '{"productMetafield":{"namespace":"custom","key":"notes","value":"gid://shopify/Metaobject/2"}}' },
    ],
  },
  { id: "filter.p.product_type", label: "Product type", values: [{ label: "Eau de Parfum", count: 10, input: '{"productType":"Eau de Parfum"}' }] },
];

describe("slugify", () => {
  it("makes readable URL values", () => {
    expect(slugify("Fig leaf")).toBe("fig-leaf");
    expect(slugify("Eau de Parfum")).toBe("eau-de-parfum");
  });
});

describe("parseCatalogParams", () => {
  it("reads repeated params, lower-cases and de-duplicates", () => {
    const p = parseCatalogParams({ family: ["Woody", "woody", "amber"], note: "vanilla", available: "1", sort: "price-desc" });
    expect(p).toEqual({ type: [], family: ["woody", "amber"], intensity: [], note: ["vanilla"], available: true, sort: "price-desc" });
  });

  it("falls back to featured for unknown sort values", () => {
    expect(parseCatalogParams({ sort: "random" }).sort).toBe("featured");
  });
});

describe("toProductFilters", () => {
  it("maps readable values to Storefront inputs and ignores unknown ones", () => {
    const p = parseCatalogParams({ family: "woody", note: ["fig-leaf", "unknown"], available: "1" });
    expect(toProductFilters(p, filters)).toEqual([
      { productMetafield: { namespace: "custom", key: "family", value: "Woody" } },
      { productMetafield: { namespace: "custom", key: "notes", value: "gid://shopify/Metaobject/1" } },
      { available: true },
    ]);
  });
});

describe("filterGroupsForView", () => {
  it("skips groups with a single value and marks checked options", () => {
    const groups = filterGroupsForView(parseCatalogParams({ note: "vanilla" }), filters);
    expect(groups.map((g) => g.param)).toEqual(["family", "note"]);
    expect(groups[1].options.find((o) => o.value === "vanilla")?.checked).toBe(true);
  });
});

describe("catalogHref / countActiveFilters", () => {
  it("round-trips params into a URL", () => {
    const p = parseCatalogParams({ family: ["woody"], note: ["vanilla"], sort: "name" });
    expect(catalogHref("/collections/perfumes", p)).toBe("/collections/perfumes?family=woody&note=vanilla&sort=name");
    expect(countActiveFilters(p)).toBe(2);
    expect(catalogHref("/collections/perfumes", parseCatalogParams({}))).toBe("/collections/perfumes");
  });
});
