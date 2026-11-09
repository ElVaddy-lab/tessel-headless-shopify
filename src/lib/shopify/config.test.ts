import { describe, expect, it } from "vitest";
import { DEFAULT_API_VERSION, readStorefrontConfig, StorefrontConfigError } from "./config";

describe("readStorefrontConfig", () => {
  it("builds the endpoint and prefers the private token", () => {
    const config = readStorefrontConfig({
      SHOPIFY_STORE_DOMAIN: "https://tessel-demo.myshopify.com/",
      SHOPIFY_STOREFRONT_PRIVATE_TOKEN: "private-123",
      SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "public-456",
      SHOPIFY_STOREFRONT_API_VERSION: "2026-07",
    });

    expect(config).toEqual({
      endpoint: "https://tessel-demo.myshopify.com/api/2026-07/graphql.json",
      token: "private-123",
      tokenType: "private",
    });
  });

  it("falls back to the public token and the default API version", () => {
    const config = readStorefrontConfig({
      SHOPIFY_STORE_DOMAIN: "tessel-demo.myshopify.com",
      SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "public-456",
    });

    expect(config.tokenType).toBe("public");
    expect(config.token).toBe("public-456");
    expect(config.endpoint).toBe(
      `https://tessel-demo.myshopify.com/api/${DEFAULT_API_VERSION}/graphql.json`,
    );
  });

  it("throws when the domain is missing", () => {
    expect(() => readStorefrontConfig({ SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "x" })).toThrow(
      StorefrontConfigError,
    );
  });

  it("throws when no token is set", () => {
    expect(() => readStorefrontConfig({ SHOPIFY_STORE_DOMAIN: "a.myshopify.com" })).toThrow(
      /TOKEN/,
    );
  });
});
