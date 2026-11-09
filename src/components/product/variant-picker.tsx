"use client";

import { useId } from "react";
import { formatPrice } from "@/lib/format";
import type { Variant } from "@/lib/shopify/product-detail";

type Props = {
  optionName: string;
  variants: Variant[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Size selector: radio group drawn as square cells. Sold-out sizes stay focusable and say so. */
export function VariantPicker({ optionName, variants, selectedId, onSelect }: Props) {
  const name = useId();

  return (
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
              className={`relative flex min-h-16 cursor-pointer flex-col items-start justify-center border-r border-b border-control px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-4px] has-[:focus-visible]:outline-ink ${checked ? "bg-ink text-paper has-[:focus-visible]:outline-paper" : "bg-paper hover:bg-paper-2"}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={v.id}
                checked={checked}
                onChange={() => onSelect(v.id)}
                className="sr-only"
                aria-describedby={v.availableForSale ? undefined : `${id}-soldout`}
              />
              <span className={`text-sm font-medium ${v.availableForSale ? "" : "line-through"}`}>{v.option}</span>
              <span className={`label ${checked ? "text-paper" : "text-muted"}`}>
                {v.availableForSale ? formatPrice(v.price) : <span id={`${id}-soldout`}>Sold out</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
