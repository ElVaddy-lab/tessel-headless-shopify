/**
 * Catalog URL ⇄ Storefront filters.
 * URLs stay readable (`?family=woody&note=vanilla&sort=price-asc`); the Storefront `input`
 * for each value (which for notes is a metaobject GID) comes from the collection's own
 * filter list, so nothing here hard-codes Shopify ids.
 */

export const SORTS = {
  featured: { sortKey: "CREATED", reverse: false, label: "Featured" },
  "price-asc": { sortKey: "PRICE", reverse: false, label: "Price: low to high" },
  "price-desc": { sortKey: "PRICE", reverse: true, label: "Price: high to low" },
  name: { sortKey: "TITLE", reverse: false, label: "Name A–Z" },
} as const;

export type SortId = keyof typeof SORTS;

export const FILTER_GROUPS = [
  { param: "type", filterId: "filter.p.product_type", label: "Type" },
  { param: "family", filterId: "filter.p.m.custom.family", label: "Family" },
  { param: "intensity", filterId: "filter.p.m.custom.intensity", label: "Intensity" },
  { param: "note", filterId: "filter.p.m.custom.notes", label: "Notes" },
] as const;

export type FilterParam = (typeof FILTER_GROUPS)[number]["param"];

export type CatalogParams = Record<FilterParam, string[]> & { available: boolean; sort: SortId };

export type StorefrontFilterValue = { label: string; count: number; input: string };
export type StorefrontFilter = { id: string; label: string; values: StorefrontFilterValue[] };

/** A Storefront `ProductFilter` input object (already parsed from the filter's JSON `input`). */
export type ProductFilterInput = Record<string, unknown>;

type SearchParams = Record<string, string | string[] | undefined>;

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean))];
}

export function parseCatalogParams(searchParams: SearchParams): CatalogParams {
  const sort = typeof searchParams.sort === "string" && searchParams.sort in SORTS ? (searchParams.sort as SortId) : "featured";
  return {
    type: list(searchParams.type),
    family: list(searchParams.family),
    intensity: list(searchParams.intensity),
    note: list(searchParams.note),
    available: searchParams.available === "1",
    sort,
  };
}

/** Turns URL params into Storefront filters. Unknown values are ignored, not errors. */
export function toProductFilters(params: CatalogParams, filters: StorefrontFilter[]): ProductFilterInput[] {
  const result: ProductFilterInput[] = [];

  for (const group of FILTER_GROUPS) {
    const filter = filters.find((f) => f.id === group.filterId);
    if (!filter) continue;
    for (const wanted of params[group.param]) {
      const value = filter.values.find((v) => slugify(v.label) === wanted);
      if (value) result.push(JSON.parse(value.input) as ProductFilterInput);
    }
  }

  if (params.available) result.push({ available: true });
  return result;
}

export type FilterGroupView = {
  param: FilterParam;
  label: string;
  options: { value: string; label: string; count: number; checked: boolean }[];
};

/** Filter groups for the sidebar: only groups the collection actually has, with checked state. */
export function filterGroupsForView(params: CatalogParams, filters: StorefrontFilter[]): FilterGroupView[] {
  return FILTER_GROUPS.flatMap((group) => {
    const filter = filters.find((f) => f.id === group.filterId);
    if (!filter || filter.values.length < 2) return [];
    return [
      {
        param: group.param,
        label: group.label,
        options: filter.values.map((v) => ({
          value: slugify(v.label),
          label: v.label,
          count: v.count,
          checked: params[group.param].includes(slugify(v.label)),
        })),
      },
    ];
  });
}

export function countActiveFilters(params: CatalogParams): number {
  return FILTER_GROUPS.reduce((n, g) => n + params[g.param].length, 0) + (params.available ? 1 : 0);
}

/** Builds a catalog URL, e.g. to remove one filter chip. */
export function catalogHref(pathname: string, params: CatalogParams): string {
  const sp = new URLSearchParams();
  for (const group of FILTER_GROUPS) for (const v of params[group.param]) sp.append(group.param, v);
  if (params.available) sp.set("available", "1");
  if (params.sort !== "featured") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
