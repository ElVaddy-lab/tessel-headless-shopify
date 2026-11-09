import { describe, expect, it, vi } from "vitest";
import type { StorefrontConfig } from "./config";
import { buildHeaders, StorefrontError, storefrontRequest } from "./request";

const privateConfig: StorefrontConfig = {
  endpoint: "https://shop.example/api/2026-10/graphql.json",
  token: "secret-token",
  tokenType: "private",
};

const publicConfig: StorefrontConfig = { ...privateConfig, token: "public-token", tokenType: "public" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("buildHeaders", () => {
  it("uses the private token header and forwards the buyer IP", () => {
    const headers = buildHeaders(privateConfig, "203.0.113.7");
    expect(headers["Shopify-Storefront-Private-Token"]).toBe("secret-token");
    expect(headers["Shopify-Storefront-Buyer-IP"]).toBe("203.0.113.7");
    expect(headers["X-Shopify-Storefront-Access-Token"]).toBeUndefined();
  });

  it("uses the public token header", () => {
    const headers = buildHeaders(publicConfig);
    expect(headers["X-Shopify-Storefront-Access-Token"]).toBe("public-token");
    expect(headers["Shopify-Storefront-Private-Token"]).toBeUndefined();
  });
});

describe("storefrontRequest", () => {
  it("posts the query and variables and returns data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { shop: { name: "Tessel" } } }));

    const data = await storefrontRequest<{ shop: { name: string } }, { first: number }>(
      privateConfig,
      { query: "query Shop { shop { name } }", variables: { first: 1 } },
      fetchMock,
    );

    expect(data.shop.name).toBe("Tessel");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(privateConfig.endpoint);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      query: "query Shop { shop { name } }",
      variables: { first: 1 },
    });
  });

  it("throws StorefrontError with status on HTTP errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }));

    await expect(storefrontRequest(privateConfig, { query: "{ shop { name } }" }, fetchMock)).rejects.toMatchObject({
      name: "StorefrontError",
      status: 401,
    });
  });

  it("throws on GraphQL errors and keeps them for debugging", async () => {
    const errors = [{ message: "Field 'nope' doesn't exist on type 'Shop'" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ errors }));

    const promise = storefrontRequest(privateConfig, { query: "{ shop { nope } }" }, fetchMock);
    await expect(promise).rejects.toBeInstanceOf(StorefrontError);
    await expect(promise).rejects.toMatchObject({ errors });
  });

  it("throws when the response has no data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: null }));
    await expect(storefrontRequest(privateConfig, { query: "{ shop { name } }" }, fetchMock)).rejects.toThrow(
      /no data/,
    );
  });

  it("wraps network failures and never leaks the token", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    const error: StorefrontError = await storefrontRequest(
      privateConfig,
      { query: "{ shop { name } }" },
      fetchMock,
    ).then(
      () => {
        throw new Error("expected the request to fail");
      },
      (e: unknown) => e as StorefrontError,
    );

    expect(error).toBeInstanceOf(StorefrontError);
    expect(error.message).not.toContain("secret-token");
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});
