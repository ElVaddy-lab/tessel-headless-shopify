import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterForm } from "@/components/catalog/filter-form";
import { FiltersPanel } from "@/components/catalog/filters-panel";
import { ProductCard } from "@/components/product-card";
import {
  catalogHref,
  countActiveFilters,
  FILTER_GROUPS,
  filterGroupsForView,
  parseCatalogParams,
  toProductFilters,
  type CatalogParams,
} from "@/lib/catalog-params";
import { getCollectionFilters, getCollectionHandles, getCollectionPage, getCollectionProducts } from "@/lib/shopify/catalog";

export async function generateStaticParams() {
  const handles = await getCollectionHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const listing = await getCollectionProducts(handle, 1);
  if (!listing) return {};
  return { title: listing.title, alternates: { canonical: `/collections/${handle}` } };
}

export default function CollectionPage(props: PageProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionView {...props} />
    </Suspense>
  );
}

async function CollectionView({ params, searchParams }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  const catalogParams = parseCatalogParams(await searchParams);

  const allFilters = await getCollectionFilters(handle);
  if (!allFilters) notFound();
  const page = await getCollectionPage(handle, toProductFilters(catalogParams, allFilters), catalogParams.sort);
  if (!page) notFound();

  const path = `/collections/${handle}`;
  const groups = filterGroupsForView(catalogParams, allFilters);
  const active = activeChips(catalogParams, groups.flatMap((g) => g.options.map((o) => ({ ...o, param: g.param }))), path);
  const availability = allFilters.find((f) => f.id === "filter.v.availability");
  const hasOutOfStock = (availability?.values.find((v) => v.label === "Out of stock")?.count ?? 0) > 0;
  const count = page.products.length;

  return (
    <div className="container-page pt-8 pb-20 lg:pt-12 lg:pb-28">
      <div className="border-b border-line pb-6">
        <p className="label text-muted">Collection</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.01em]">{page.title}</h1>
        {page.description ? <p className="mt-3 max-w-[60ch] text-muted">{page.description}</p> : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <aside aria-label="Filters" className="lg:col-span-3">
          <FiltersPanel activeCount={countActiveFilters(catalogParams)}>
            <FilterForm action={path} params={catalogParams} groups={groups} hasOutOfStock={hasOutOfStock} />
          </FiltersPanel>
        </aside>

        <section aria-labelledby="results-title" className="lg:col-span-9">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4">
            <h2 id="results-title" className="label text-muted" aria-live="polite">
              {count} {count === 1 ? "product" : "products"}
            </h2>
            {active.length ? (
              <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                {active.map((chip) => (
                  <li key={chip.key}>
                    <Link
                      href={chip.href}
                      className="inline-flex min-h-8 items-center gap-2 border border-control px-3 text-sm hover:border-ink"
                      aria-label={`Remove filter: ${chip.label}`}
                    >
                      {chip.label} <span aria-hidden="true">×</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {count ? (
            <ul className="grid grid-cols-2 border-t border-l border-line sm:grid-cols-3">
              {page.products.map((product, i) => (
                <li key={product.handle} className="border-r border-b border-line">
                  <ProductCard
                    product={product}
                    priority={i < 3}
                    sizes="(min-width: 64rem) 23vw, (min-width: 40rem) 31vw, 48vw"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-line p-8">
              <p className="text-lg font-medium">No products match these filters.</p>
              <p className="mt-2 text-muted">Try removing a filter, or let the finder suggest something close.</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href={path} className="inline-flex min-h-11 items-center bg-ink px-5 text-sm text-paper hover:bg-ink/85">
                  Clear filters
                </Link>
                <Link href="/finder" className="inline-flex min-h-11 items-center py-2 text-sm underline underline-offset-4">
                  Open the finder
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function activeChips(
  params: CatalogParams,
  options: { param: (typeof FILTER_GROUPS)[number]["param"]; value: string; label: string }[],
  path: string,
) {
  const chips = FILTER_GROUPS.flatMap((group) =>
    params[group.param].map((value) => {
      const option = options.find((o) => o.param === group.param && o.value === value);
      const label = group.param === "intensity" ? `Intensity ${value}` : (option?.label ?? value);
      const without = { ...params, [group.param]: params[group.param].filter((v) => v !== value) };
      return { key: `${group.param}-${value}`, label, href: catalogHref(path, without) };
    }),
  );
  if (params.available) {
    chips.push({ key: "available", label: "In stock", href: catalogHref(path, { ...params, available: false }) });
  }
  return chips;
}

function CollectionSkeleton() {
  return (
    <div className="container-page pt-8 pb-20 lg:pt-12" aria-busy="true" aria-label="Loading collection">
      <div className="h-24 border-b border-line" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:ml-[25%] lg:w-3/4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] bg-wall/40" />
        ))}
      </div>
    </div>
  );
}
