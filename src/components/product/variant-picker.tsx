"use client";

import { useId, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Variant } from "@/lib/shopify/product-detail";

type Props = {
  optionName: string;
  variants: Variant[];
};

/** Size selector: radio group drawn as square cells. Sold-out sizes stay focusable and say so. */
export function VariantPicker({ optionName, variants }: Props) {
  const name = useId();
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable.id);
  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;

  return (
    <div>
      <fieldset>
        <legend className="label mb-3 text-muted">{optionName}</legend>
        <div
          className="grid border-t border-l border-control"
          style={{ gridTemplateColumns: `repeat(${Math.min(variants.length, 3)}, minmax(0, 1fr))` }}
        >
          {variants.map((v) => {
            const id = `${name}-${v.id}`;
            const checked = v.id === selectedId;
            return (
              <label
                key={v.id}
                htmlFor={id}
                className={`relative flex min-h-16 cursor-pointer flex-col items-start justify-center border-r border-b border-control px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-4px] has-[:focus-visible]:outline-ink ${checked ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2"}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={v.id}
                  checked={checked}
                  onChange={() => setSelectedId(v.id)}
                  className="sr-only"
                  aria-describedby={v.availableForSale ? undefined : `${id}-soldout`}
                />
                <span className={`text-sm font-medium ${v.availableForSale ? "" : "line-through"}`}>{v.option}</span>
                <span className={`label ${checked ? "text-paper/80" : "text-muted"}`}>
                  {v.availableForSale ? formatPrice(v.price) : <span id={`${id}-soldout`}>Sold out</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-5 text-2xl font-medium" aria-live="polite">
        {formatPrice(selected.price)}
        <span className="sr-only">, {selected.option}</span>
        {!selected.availableForSale ? <span className="label ml-3 align-middle text-muted">Sold out</span> : null}
      </p>
      {selected.burnTimeHours ? (
        <p className="label mt-1 text-muted">Burns for about {selected.burnTimeHours} hours</p>
      ) : null}
    </div>
  );
}
