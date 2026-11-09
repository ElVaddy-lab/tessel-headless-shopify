import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { normalizeQuery, searchProducts } from "@/lib/shopify/search";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="container-page pt-8 pb-20 lg:pt-12 lg:pb-28">
      <div className="border-b border-line pb-6">
        <p className="label text-muted">Search</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-medium">Search the collection</h1>
        <Suspense fallback={<SearchForm defaultValue="" />}>
          <SearchFormWithQuery searchParams={props.searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<p className="mt-8 text-muted">Searching…</p>}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <Form action="/search" role="search" className="mt-6 flex max-w-2xl flex-wrap gap-3">
      <label htmlFor="q" className="sr-only">
        Search fragrances, notes and candles
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Vanilla, Quoin, candle…"
        className="min-h-12 min-w-0 flex-1 border border-control bg-paper px-4"
      />
      <button type="submit" className="inline-flex min-h-12 items-center bg-ink px-6 text-sm text-paper hover:bg-ink/85">
        Search
      </button>
    </Form>
  );
}

async function SearchFormWithQuery({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const q = normalizeQuery((await searchParams).q);
  return <SearchForm key={q} defaultValue={q} />;
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const q = normalizeQuery((await searchParams).q);
  if (!q) {
    return <p className="mt-8 text-muted">Search by name, note or product type — for example “vanilla”, “cedar” or “candle”.</p>;
  }

  const { totalCount, products } = await searchProducts(q);

  return (
    <section aria-labelledby="search-results-title" className="mt-8">
      <h2 id="search-results-title" className="label text-muted" aria-live="polite">
        {totalCount} {totalCount === 1 ? "result" : "results"} for “{q}”
      </h2>
      {products.length ? (
        <ul className="mt-4 grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <li key={product.handle} className="border-r border-b border-line">
              <ProductCard product={product} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 31vw, 48vw" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 border border-line p-8">
          <p className="text-lg font-medium">Nothing matches “{q}”.</p>
          <p className="mt-2 text-muted">Try a single note, or let the finder suggest something.</p>
          <Link href="/finder" className="mt-6 inline-flex min-h-11 items-center bg-ink px-5 text-sm text-paper hover:bg-ink/85">
            Open the finder
          </Link>
        </div>
      )}
    </section>
  );
}
