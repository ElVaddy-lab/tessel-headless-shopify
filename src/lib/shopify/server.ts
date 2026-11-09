import "server-only";

import { readStorefrontConfig } from "./config";
import { storefrontRequest, type StorefrontRequest } from "./request";

/**
 * Server-side entry point for Storefront API calls.
 * Callers add caching themselves ('use cache' + cacheLife + cacheTag) at the query level,
 * so webhooks can invalidate exactly what changed.
 */
export function storefront<TData, TVariables = Record<string, unknown>>(
  request: StorefrontRequest<TVariables>,
): Promise<TData> {
  return storefrontRequest<TData, TVariables>(readStorefrontConfig(), request);
}

export { StorefrontError } from "./request";
