"use client";

import Form from "next/form";
import { SORTS, type SortId } from "@/lib/catalog-params";
import { useHydrated } from "./use-hydrated";

type Props = {
  action: string;
  current: SortId;
  options: SortId[];
  /** Active filters as [name, value] pairs, carried over so sorting keeps them. */
  keep: [string, string][];
};

/**
 * Sorting applies as soon as the select changes. Until the page hydrates, the form
 * shows its own "Sort" button instead.
 */
export function SortForm({ action, current, options, keep }: Props) {
  const hydrated = useHydrated();

  return (
    <Form action={action} className="flex items-center gap-3">
      {keep.map(([name, value]) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="sort" className="label text-muted">
        Sort by
      </label>
      <select
        key={current}
        id="sort"
        name="sort"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="min-h-11 border border-control bg-paper px-3 text-sm"
      >
        {options.map((id) => (
          <option key={id} value={id}>
            {SORTS[id].label}
          </option>
        ))}
      </select>
      {hydrated ? null : (
        <button type="submit" className="inline-flex min-h-11 items-center border border-ink px-4 text-sm">
          Sort
        </button>
      )}
    </Form>
  );
}
