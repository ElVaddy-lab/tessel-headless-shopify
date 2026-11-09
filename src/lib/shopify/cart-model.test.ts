import { describe, expect, it } from "vitest";
import { clampQuantity, toCart, withHeadlessChannel, type CartNode } from "./cart-model";

const node: CartNode = {
  id: "gid://shopify/Cart/abc",
  checkoutUrl: "https://shop.example/cart/c/abc?key=k1&_s=s",
  totalQuantity: 3,
  cost: { subtotalAmount: { amount: "149.0", currencyCode: "USD" } },
  lines: {
    nodes: [
      {
        id: "line-1",
        quantity: 2,
        cost: { totalAmount: { amount: "76.0", currencyCode: "USD" } },
        merchandise: {
          id: "variant-10",
          title: "10 ml",
          availableForSale: true,
          image: null,
          product: {
            handle: "quoin",
            title: "Quoin",
            productType: "Eau de Parfum",
            featuredImage: { url: "https://cdn.shopify.com/quoin.jpg", altText: null },
          },
        },
      },
      {
        id: "line-2",
        quantity: 1,
        cost: { totalAmount: { amount: "73.0", currencyCode: "USD" } },
        merchandise: {
          id: "variant-diffuser",
          title: "Default Title",
          availableForSale: true,
          image: { url: "https://cdn.shopify.com/d.jpg", altText: "Diffuser" },
          product: { handle: "plinth-diffuser", title: "Plinth Diffuser", productType: "Diffuser", featuredImage: null },
        },
      },
    ],
  },
};

describe("withHeadlessChannel", () => {
  it("adds the headless channel and keeps existing params", () => {
    const url = new URL(withHeadlessChannel(node.checkoutUrl));
    expect(url.searchParams.get("channel")).toBe("headless-storefronts");
    expect(url.searchParams.get("key")).toBe("k1");
  });

  it("does not duplicate the param", () => {
    const twice = withHeadlessChannel(withHeadlessChannel(node.checkoutUrl));
    expect(new URL(twice).searchParams.getAll("channel")).toHaveLength(1);
  });
});

describe("toCart", () => {
  it("maps lines, falls back to the product image and hides 'Default Title'", () => {
    const cart = toCart(node);
    expect(cart.totalQuantity).toBe(3);
    expect(cart.subtotal).toEqual({ amount: "149.0", currencyCode: "USD" });
    expect(cart.lines[0]).toMatchObject({
      variantTitle: "10 ml",
      image: { url: "https://cdn.shopify.com/quoin.jpg", alt: "Quoin" },
      product: { handle: "quoin" },
    });
    expect(cart.lines[1].variantTitle).toBeNull();
    expect(cart.checkoutUrl).toContain("channel=headless-storefronts");
  });
});

describe("clampQuantity", () => {
  it("keeps quantities within 0–10 and whole", () => {
    expect(clampQuantity(3.7)).toBe(3);
    expect(clampQuantity(-2)).toBe(0);
    expect(clampQuantity(99)).toBe(10);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});
