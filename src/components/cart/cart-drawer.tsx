"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { removeCartLine, updateCartLine, type CartActionResult } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import { MAX_LINE_QUANTITY, type Cart, type CartLine } from "@/lib/shopify/cart-model";
import { applyCartResult, setCartState, useCartState } from "./cart-store";

/** Header bag button + drawer (native <dialog>: focus trap, Esc, focus return). */
export function CartDrawer({ initialCart }: { initialCart: Cart | null }) {
  const state = useCartState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cart = state.hydrated ? state.cart : initialCart;
  const count = cart?.totalQuantity ?? 0;

  useEffect(() => {
    if (!state.hydrated) setCartState({ cart: initialCart, hydrated: true });
  }, [initialCart, state.hydrated]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state.open && !dialog.open) dialog.showModal();
    if (!state.open && dialog.open) dialog.close();
  }, [state.open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setCartState({ open: true })}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 px-1 text-sm underline-offset-4 hover:underline"
      >
        Bag
        <span className="inline-flex min-w-6 items-center justify-center bg-ink px-1.5 text-xs text-paper" aria-hidden="true">
          {count}
        </span>
        <span className="sr-only">, {count} {count === 1 ? "item" : "items"}</span>
      </button>

      <p className="sr-only" role="status" aria-live="polite">
        {state.status}
      </p>

      <dialog
        ref={dialogRef}
        aria-labelledby="cart-title"
        onClose={() => setCartState({ open: false })}
        onClick={(e) => {
          if (e.target === dialogRef.current) setCartState({ open: false });
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[26.25rem] bg-paper p-0 text-ink backdrop:bg-ink/40 sm:border-l sm:border-line"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="cart-title" tabIndex={-1} className="text-lg font-medium focus:outline-none focus-visible:outline-2">
              Your bag {count ? <span className="label text-muted">({count})</span> : null}
            </h2>
            <button
              type="button"
              onClick={() => setCartState({ open: false })}
              className="inline-flex size-11 items-center justify-center text-2xl leading-none"
              aria-label="Close bag"
            >
              ×
            </button>
          </div>

          {state.error ? (
            <p role="alert" className="border-b border-line bg-paper-2 px-5 py-3 text-sm">
              {state.error}
            </p>
          ) : null}

          {cart && cart.lines.length ? (
            <>
              <ul className="flex-1 overflow-y-auto px-5">
                {cart.lines.map((line) => (
                  <CartLineRow key={line.id} line={line} />
                ))}
              </ul>
              <div className="border-t border-line px-5 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="label text-muted">Subtotal</span>
                  <span className="text-xl font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">Shipping and taxes are calculated at checkout.</p>
                <a
                  href={cart.checkoutUrl}
                  className="mt-4 flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm tracking-wide text-paper hover:bg-ink/85"
                >
                  Checkout
                </a>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Demo store: checkout runs in Shopify’s test mode and no order is fulfilled.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-start gap-4 px-5 py-10">
              <p className="text-lg font-medium">Your bag is empty.</p>
              <p className="text-sm text-muted">Not sure where to start? The finder suggests three scents in a minute.</p>
              <Link
                href="/finder"
                onClick={() => setCartState({ open: false })}
                className="inline-flex min-h-11 items-center bg-ink px-5 text-sm text-paper hover:bg-ink/85"
              >
                Find your scent
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<CartActionResult>, message: string) =>
    startTransition(async () => {
      applyCartResult(await action(), message);
    });

  const name = `${line.product.title}${line.variantTitle ? `, ${line.variantTitle}` : ""}`;

  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-b-0" aria-busy={pending}>
      <div className="relative h-24 w-18 shrink-0 bg-wall">
        {line.image ? <Image src={line.image.url} alt="" fill sizes="72px" className="object-cover" /> : null}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${pending ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${line.product.handle}`} className="font-medium underline-offset-4 hover:underline">
              {line.product.title}
            </Link>
            <p className="label text-muted">{line.variantTitle ?? line.product.productType}</p>
          </div>
          <p className="text-sm font-medium">{formatPrice(line.total)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center border border-control">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center text-lg"
              aria-label={`Decrease quantity of ${name}`}
              onClick={() =>
              !pending &&
              run(async () => {
                const result = await updateCartLine(line.id, line.quantity - 1);
                if (line.quantity === 1) document.getElementById("cart-title")?.focus();
                return result;
              }, line.quantity === 1 ? `${name} removed from your bag` : `${name}: quantity ${line.quantity - 1}`)
            }
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm">
              <span className="sr-only">Quantity </span>
              {line.quantity}
            </span>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center text-lg aria-disabled:text-control"
              aria-label={`Increase quantity of ${name}`}
              aria-disabled={line.quantity >= MAX_LINE_QUANTITY}
              onClick={() =>
                !pending &&
                line.quantity < MAX_LINE_QUANTITY &&
                run(() => updateCartLine(line.id, line.quantity + 1), `${name}: quantity ${line.quantity + 1}`)
              }
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="min-h-9 text-sm underline underline-offset-4 hover:no-underline"
            aria-label={`Remove ${name}`}
            onClick={() =>
              !pending &&
              run(async () => {
                const result = await removeCartLine(line.id);
                // The row (and this button) disappears: keep focus inside the dialog.
                document.getElementById("cart-title")?.focus();
                return result;
              }, `${name} removed from your bag`)
            }
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
