/**
 * Storefront API settings read from environment variables.
 * Kept free of `server-only` so it can be unit-tested; the token itself is
 * only ever read on the server (see ./server.ts).
 */

export const DEFAULT_API_VERSION = "2026-10";

export type StorefrontTokenType = "private" | "public";

export type StorefrontConfig = {
  endpoint: string;
  token: string;
  tokenType: StorefrontTokenType;
};

export class StorefrontConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorefrontConfigError";
  }
}

type Env = Record<string, string | undefined>;

export function readStorefrontConfig(env: Env = process.env): StorefrontConfig {
  const domain = env.SHOPIFY_STORE_DOMAIN?.trim();
  const privateToken = env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
  const publicToken = env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim();
  const version = env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain) {
    throw new StorefrontConfigError("SHOPIFY_STORE_DOMAIN is not set");
  }
  if (!privateToken && !publicToken) {
    throw new StorefrontConfigError(
      "Set SHOPIFY_STOREFRONT_PRIVATE_TOKEN (preferred) or SHOPIFY_STOREFRONT_PUBLIC_TOKEN",
    );
  }

  const host = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return {
    endpoint: `https://${host}/api/${version}/graphql.json`,
    token: (privateToken || publicToken) as string,
    tokenType: privateToken ? "private" : "public",
  };
}
