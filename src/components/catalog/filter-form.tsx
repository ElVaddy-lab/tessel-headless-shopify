import Form from "next/form";
import Link from "next/link";
import { SORTS, type CatalogParams, type FilterGroupView } from "@/lib/catalog-params";

type Props = {
  action: string;
  params: CatalogParams;
  groups: FilterGroupView[];
  /** Number of products in the collection that are in stock (for the label). */
  hasOutOfStock: boolean;
};

/**
 * Plain GET form: works without JavaScript, and with it `next/form` turns submission
 * into a client-side navigation. Filters apply on "Apply", not on every click.
 */
export function FilterForm({ action, params, groups, hasOutOfStock }: Props) {
  return (
    <Form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="sort" className="label text-muted">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={params.sort}
          className="min-h-11 border border-control bg-paper px-3 text-sm"
        >
          {Object.entries(SORTS).map(([id, s]) => (
            <option key={id} value={id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {groups.map((group) => (
        <fieldset key={group.param} className="border-t border-line pt-4">
          <legend className="label float-left mb-3 w-full text-muted">{group.label}</legend>
          <ul className={`clear-both grid gap-x-4 gap-y-1 ${group.param === "note" ? "grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : ""}`}>
            {group.options.map((option) => {
              const id = `f-${group.param}-${option.value}`;
              return (
                <li key={option.value}>
                  <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                    <input
                      id={id}
                      type="checkbox"
                      name={group.param}
                      value={option.value}
                      defaultChecked={option.checked}
                      className="size-4 shrink-0 accent-ink"
                    />
                    <span>
                      {group.param === "intensity" ? `${option.label} of 3` : option.label}{" "}
                      <span className="text-muted">({option.count})</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      {hasOutOfStock ? (
        <fieldset className="border-t border-line pt-4">
          <legend className="label float-left mb-3 w-full text-muted">Availability</legend>
          <label htmlFor="f-available" className="clear-both flex min-h-9 cursor-pointer items-center gap-2 text-sm">
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
        </fieldset>
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
