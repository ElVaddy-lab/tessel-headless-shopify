import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shopify signs every webhook: base64(HMAC-SHA256(secret, raw body)) in X-Shopify-Hmac-Sha256.
 * Compared in constant time; any malformed input is simply "not valid".
 */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let received: Buffer;
  try {
    received = Buffer.from(hmacHeader, "base64");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Cache tags to revalidate for a webhook topic (see TAGS in lib/shopify/catalog.ts). */
export function tagsForWebhook(topic: string | null, payload: unknown): string[] {
  const handle =
    payload && typeof payload === "object" && "handle" in payload && typeof payload.handle === "string"
      ? payload.handle
      : null;

  switch (topic) {
    case "products/create":
    case "products/update":
    case "products/delete":
      // Price, stock, metafields or collection membership may have changed.
      return ["products", "collections", ...(handle ? [`product:${handle}`] : [])];
    case "inventory_levels/update":
      // Payload has no product handle; availability shows on listings and product pages.
      return ["products"];
    case "collections/create":
    case "collections/update":
    case "collections/delete":
      return ["collections", ...(handle ? [`collection:${handle}`] : [])];
    default:
      return [];
  }
}

export const WEBHOOK_TOPICS = [
  "PRODUCTS_CREATE",
  "PRODUCTS_UPDATE",
  "PRODUCTS_DELETE",
  "INVENTORY_LEVELS_UPDATE",
  "COLLECTIONS_CREATE",
  "COLLECTIONS_UPDATE",
  "COLLECTIONS_DELETE",
] as const;
