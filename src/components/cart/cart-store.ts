"use client";

import { useSyncExternalStore } from "react";
import type { Cart } from "@/lib/shopify/cart-model";

/**
 * Tiny shared store: the header's cart drawer and every "Add to bag" button read the
 * same cart without a context provider wrapping the whole layout.
 */
export type CartState = {
  cart: Cart | null;
  hydrated: boolean;
  open: boolean;
  /** Message for the polite live region ("Quoin added to your bag"). */
  status: string;
  error: string | null;
};

const initial: CartState = { cart: null, hydrated: false, open: false, status: "", error: null };
let state: CartState = initial;
const listeners = new Set<() => void>();

export function setCartState(patch: Partial<CartState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies a server action result: new cart + announcement, or keep the old cart and show the error. */
export function applyCartResult(
  result: { ok: true; cart: Cart } | { ok: false; error: string; cart: Cart | null },
  successMessage: string,
  extra: Partial<CartState> = {},
) {
  if (result.ok) {
    setCartState({ cart: result.cart, status: successMessage, error: null, ...extra });
  } else {
    setCartState({ ...(result.cart ? { cart: result.cart } : {}), status: result.error, error: result.error, ...extra });
  }
}

export function useCartState(): CartState {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}
