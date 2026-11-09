"use server";

import { cookies, headers } from "next/headers";
import { addLines, CartError, createCart, getCart, removeLines, updateLines } from "@/lib/shopify/cart";
import { clampQuantity, type Cart } from "@/lib/shopify/cart-model";

const CART_COOKIE = "tessel_cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type CartActionResult = { ok: true; cart: Cart } | { ok: false; error: string; cart: Cart | null };

async function buyerIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

async function storeCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

/** Reads the shopper's cart from the cookie; a missing or expired cart yields null. */
export async function loadCart(): Promise<Cart | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  try {
    return await getCart(id, await buyerIp());
  } catch {
    return null;
  }
}

function failure(error: unknown, cart: Cart | null): CartActionResult {
  const message =
    error instanceof CartError ? error.message : "The store didn’t respond. Check your connection and try again.";
  return { ok: false, error: message, cart };
}

const isVariantId = (id: unknown): id is string => typeof id === "string" && id.startsWith("gid://shopify/ProductVariant/");
const isLineId = (id: unknown): id is string => typeof id === "string" && id.startsWith("gid://shopify/CartLine/");

export async function addToCart(variantId: string, quantity = 1): Promise<CartActionResult> {
  if (!isVariantId(variantId)) return { ok: false, error: "Unknown product option.", cart: null };
  const lines = [{ merchandiseId: variantId, quantity: Math.max(1, clampQuantity(quantity)) }];
  const ip = await buyerIp();
  const existing = await loadCart();

  try {
    const cart = existing ? await addLines(existing.id, lines, ip) : await createCart(lines, ip);
    if (!existing) await storeCartId(cart.id);
    return { ok: true, cart };
  } catch (error) {
    return failure(error, existing);
  }
}

export async function updateCartLine(lineId: string, quantity: number): Promise<CartActionResult> {
  const existing = await loadCart();
  if (!existing || !isLineId(lineId)) return { ok: false, error: "Your bag has changed. Refresh the page.", cart: existing };
  const q = clampQuantity(quantity);
  try {
    const ip = await buyerIp();
    const cart = q === 0 ? await removeLines(existing.id, [lineId], ip) : await updateLines(existing.id, [{ id: lineId, quantity: q }], ip);
    return { ok: true, cart };
  } catch (error) {
    return failure(error, existing);
  }
}

export async function removeCartLine(lineId: string): Promise<CartActionResult> {
  return updateCartLine(lineId, 0);
}
