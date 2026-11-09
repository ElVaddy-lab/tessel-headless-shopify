"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { formatPrice } from "@/lib/format";
import type { Variant } from "@/lib/shopify/product-detail";
import { applyCartResult } from "../cart/cart-store";
import { VariantPicker } from "./variant-picker";

type Props = {
  title: string;
  optionName: string | null;
  variants: Variant[];
};

/** Size picker + price + "Add to bag". Opens the bag drawer on success. */
export function ProductPurchase({ title, optionName, variants }: Props) {
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable.id);
  const [pending, startTransition] = useTransition();
  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;
  const soldOut = !selected.availableForSale;
  const label = `${title}${selected.option ? `, ${selected.option}` : ""}`;

  const add = () => {
    if (soldOut || pending) return;
    startTransition(async () => {
      const result = await addToCart(selected.id);
      applyCartResult(result, `${label} added to your bag`, { open: true });
    });
  };

  return (
    <div>
      {optionName ? (
        <VariantPicker optionName={optionName} variants={variants} selectedId={selectedId} onSelect={setSelectedId} />
      ) : null}

      <p className="mt-5 text-2xl font-medium">
        {formatPrice(selected.price)}
        {selected.option ? <span className="sr-only">, {selected.option}</span> : null}
        {soldOut ? <span className="label ml-3 align-middle text-muted">Sold out</span> : null}
      </p>
      {selected.burnTimeHours ? (
        <p className="label mt-1 text-muted">Burns for about {selected.burnTimeHours} hours</p>
      ) : null}

      <button
        type="button"
        onClick={add}
        aria-disabled={soldOut || pending}
        aria-describedby={soldOut ? "soldout-note" : undefined}
        className="mt-5 flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm tracking-wide text-paper hover:bg-ink/85 aria-disabled:cursor-not-allowed aria-disabled:bg-control aria-disabled:hover:bg-control sm:w-auto sm:min-w-64"
      >
        {pending ? "Adding…" : soldOut ? "Sold out" : "Add to bag"}
      </button>
      {soldOut ? (
        <p id="soldout-note" className="mt-2 text-sm text-muted">
          This size is sold out. Pick another size above.
        </p>
      ) : null}
    </div>
  );
}
