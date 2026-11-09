"use client";

import { useId, useState, type ReactNode } from "react";

/** On small screens the filters collapse behind a toggle; from lg they are always shown. */
export function FiltersPanel({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 w-full items-center justify-between border border-ink px-4 text-sm lg:hidden"
      >
        <span>
          Filters{activeCount ? ` (${activeCount})` : ""}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div id={panelId} className={`${open ? "block" : "hidden"} pt-6 lg:block lg:pt-0`}>
        {children}
      </div>
    </div>
  );
}
