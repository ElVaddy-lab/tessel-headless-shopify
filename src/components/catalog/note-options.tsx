"use client";

import { useId, useState } from "react";
import type { FilterGroupView } from "@/lib/catalog-params";
import { FilterOption } from "./filter-option";
import { useHydrated } from "./use-hydrated";

/**
 * The notes list is long (46), so with JavaScript it gets a search box that hides
 * non-matching rows. Rows stay in the DOM, so ticks made before searching are still submitted.
 * Until the page hydrates the full list is shown and the box is not rendered.
 */
export function NoteOptions({ options }: { options: FilterGroupView["options"] }) {
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const inputId = useId();
  const needle = query.trim().toLowerCase();
  const matches = (label: string) => !needle || label.toLowerCase().includes(needle);
  const shown = options.filter((o) => matches(o.label)).length;
  // Selected notes first, so they are not lost somewhere in the scrolled list.
  const ordered = [...options.filter((o) => o.checked), ...options.filter((o) => !o.checked)];

  return (
    <div>
      {hydrated ? (
        <div className="mb-3">
          <label htmlFor={inputId} className="sr-only">
            Search notes
          </label>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter here means "search", not "apply the filters".
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Search notes"
            autoComplete="off"
            className="min-h-11 w-full border border-control bg-paper px-3 text-sm placeholder:text-muted"
          />
          <p className="sr-only" aria-live="polite">
            {needle ? `${shown} of ${options.length} notes shown` : ""}
          </p>
        </div>
      ) : null}

      <ul className="grid max-h-80 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto pr-1 lg:grid-cols-1 xl:grid-cols-2">
        {ordered.map((option) => (
          <FilterOption key={option.value} param="note" option={option} hidden={!matches(option.label)} />
        ))}
      </ul>
      {needle && shown === 0 ? <p className="py-2 text-sm text-muted">No notes match “{query.trim()}”.</p> : null}
    </div>
  );
}
