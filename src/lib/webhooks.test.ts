import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { tagsForWebhook, verifyShopifyHmac } from "./webhooks";

const secret = "test-secret";
const body = JSON.stringify({ id: 1, handle: "quoin", title: "Quoin" });
const sign = (raw: string, key = secret) => createHmac("sha256", key).update(raw, "utf8").digest("base64");

describe("verifyShopifyHmac", () => {
  it("accepts a correctly signed body", () => {
    expect(verifyShopifyHmac(body, sign(body), secret)).toBe(true);
  });

  it("rejects a tampered body, a wrong secret, a missing or malformed header", () => {
    expect(verifyShopifyHmac(body.replace("Quoin", "Free"), sign(body), secret)).toBe(false);
    expect(verifyShopifyHmac(body, sign(body, "other"), secret)).toBe(false);
    expect(verifyShopifyHmac(body, null, secret)).toBe(false);
    expect(verifyShopifyHmac(body, "not-base64-%%%", secret)).toBe(false);
    expect(verifyShopifyHmac(body, sign(body), "")).toBe(false);
  });
});

describe("tagsForWebhook", () => {
  it("maps product, inventory and collection topics to cache tags", () => {
    expect(tagsForWebhook("products/update", { handle: "quoin" })).toEqual(["products", "collections", "product:quoin"]);
    expect(tagsForWebhook("products/delete", { id: 1 })).toEqual(["products", "collections"]);
    expect(tagsForWebhook("inventory_levels/update", { inventory_item_id: 1 })).toEqual(["products"]);
    expect(tagsForWebhook("collections/update", { handle: "perfumes" })).toEqual(["collections", "collection:perfumes"]);
  });

  it("ignores unknown topics", () => {
    expect(tagsForWebhook("orders/create", {})).toEqual([]);
    expect(tagsForWebhook(null, null)).toEqual([]);
  });
});
