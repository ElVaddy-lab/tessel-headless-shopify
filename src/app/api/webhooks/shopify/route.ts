import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { tagsForWebhook, verifyShopifyHmac } from "@/lib/webhooks";

/**
 * Shopify → cache invalidation. Webhooks registered by the "Tessel setup" app are signed
 * with its client secret, so that is the fallback when SHOPIFY_WEBHOOK_SECRET is unset.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_ADMIN_CLIENT_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifyShopifyHmac(rawBody, request.headers.get("x-shopify-hmac-sha256"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic");
  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Signed but not JSON: nothing to read, still acknowledge so Shopify doesn't retry forever.
  }

  const tags = tagsForWebhook(topic, payload);
  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ topic, revalidated: tags });
}
