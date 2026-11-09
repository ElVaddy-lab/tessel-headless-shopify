import type { StorefrontConfig } from "./config";

export type GraphQLErrorEntry = {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
};

export class StorefrontError extends Error {
  readonly status?: number;
  readonly errors?: GraphQLErrorEntry[];

  constructor(
    message: string,
    options: { status?: number; errors?: GraphQLErrorEntry[]; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "StorefrontError";
    this.status = options.status;
    this.errors = options.errors;
  }
}

export type StorefrontRequest<TVariables> = {
  query: string;
  variables?: TVariables;
  /** Shopper IP, forwarded with private tokens so Shopify can rate-limit per buyer. */
  buyerIp?: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function buildHeaders(config: StorefrontConfig, buyerIp?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (config.tokenType === "private") {
    headers["Shopify-Storefront-Private-Token"] = config.token;
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = config.token;
  }

  return headers;
}

/**
 * Sends one GraphQL operation to the Storefront API.
 * Throws StorefrontError on network failure, non-2xx status, GraphQL errors or missing data.
 * Error messages never include the access token.
 */
export async function storefrontRequest<TData, TVariables = Record<string, unknown>>(
  config: StorefrontConfig,
  { query, variables, buyerIp }: StorefrontRequest<TVariables>,
  fetchImpl: FetchLike = fetch,
): Promise<TData> {
  let response: Response;
  try {
    response = await fetchImpl(config.endpoint, {
      method: "POST",
      headers: buildHeaders(config, buyerIp),
      body: JSON.stringify({ query, variables }),
    });
  } catch (cause) {
    throw new StorefrontError("Storefront API request failed (network error)", { cause });
  }

  if (!response.ok) {
    throw new StorefrontError(`Storefront API responded with HTTP ${response.status}`, {
      status: response.status,
    });
  }

  let body: { data?: TData | null; errors?: GraphQLErrorEntry[] };
  try {
    body = await response.json();
  } catch (cause) {
    throw new StorefrontError("Storefront API returned invalid JSON", {
      status: response.status,
      cause,
    });
  }

  if (body.errors?.length) {
    throw new StorefrontError(
      `Storefront API GraphQL error: ${body.errors.map((e) => e.message).join("; ")}`,
      { status: response.status, errors: body.errors },
    );
  }

  if (body.data == null) {
    throw new StorefrontError("Storefront API returned no data", { status: response.status });
  }

  return body.data;
}
