import Form from "next/form";
import Link from "next/link";
import type { CatalogParams, FilterGroupView } from "@/lib/catalog-params";
import { FilterOption } from "./filter-option";
import { NoteOptions } from "./note-options";

type Props = {
  action: string;
  params: CatalogParams;
  groups: FilterGroupView[];
  /** Whether the collection has sold-out products (otherwise "In stock only" is pointless). */
  hasOutOfStock: boolean;
};

const summaryClass =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden";

/** Collapsible group; opens by itself when one of its values is selected. */
function Group({ label, selected, children }: { label: string; selected: number; children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: a visitor may open a group before JavaScript has loaded.
    <details open={selected > 0} suppressHydrationWarning className="group border-t border-line">
      <summary className={summaryClass}>
        <span className="label text-muted">
          {label}
          {selected ? <span className="text-ink"> · {selected}</span> : null}
        </span>
        <span aria-hidden="true" className="text-lg leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <fieldset className="pb-4">
        <legend className="sr-only">{label}</legend>
        {children}
      </fieldset>
    </details>
  );
}

/**
 * Plain GET form: works without JavaScript, and with it `next/form` turns submission
 * into a client-side navigation. Filters apply on "Apply", not on every click.
 * Sorting lives above the results (SortForm); the current sort is carried here as a hidden field.
 */
export function FilterForm({ action, params, groups, hasOutOfStock }: Props) {
  return (
    <Form action={action} className="flex flex-col">
      {params.sort !== "featured" ? <input type="hidden" name="sort" value={params.sort} /> : null}

      {groups.map((group) => (
        <Group key={group.param} label={group.label} selected={group.options.filter((o) => o.checked).length}>
          {group.param === "note" ? (
            <NoteOptions options={group.options} />
          ) : (
            <ul className="grid gap-y-1">
              {group.options.map((option) => (
                <FilterOption
                  key={option.value}
                  param={group.param}
                  option={option}
                  label={group.param === "intensity" ? `${option.label} of 3` : option.label}
                />
              ))}
            </ul>
          )}
        </Group>
      ))}

      {hasOutOfStock ? (
        <Group label="Availability" selected={params.available ? 1 : 0}>
          <label htmlFor="f-available" className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
            <input
              id="f-available"
              type="checkbox"
              name="available"
              value="1"
              defaultChecked={params.available}
              className="size-4 accent-ink"
            />
            In stock only
          </label>
        </Group>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
        <button type="submit" className="inline-flex min-h-11 items-center bg-ink px-5 text-sm text-paper hover:bg-ink/85">
          Apply
        </button>
        <Link href={action} className="py-2 text-sm underline underline-offset-4 hover:no-underline">
          Clear all
        </Link>
      </div>
    </Form>
  );
}
