import type { Metadata } from "next";
import { Suspense } from "react";
import { Finder, type FinderSet } from "@/components/finder/finder";
import { getPerfumeProfiles, getProduct } from "@/lib/shopify/catalog";

export const metadata: Metadata = {
  title: "Find your scent",
  description: "Answer four quick questions and pick the notes you like: the finder scores all ten Tessel fragrances and explains every match.",
  alternates: { canonical: "/finder" },
};

const SET_HANDLES = ["discovery-set-light", "discovery-set-deep"];

export default function FinderPage() {
  return (
    <div className="container-page pt-8 pb-20 lg:pt-12 lg:pb-28">
      <div className="border-b border-line pb-6">
        <p className="label text-muted">Fragrance finder</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.01em]">Find your scent</h1>
        <p className="mt-3 max-w-[60ch] text-muted">
          Four quick questions, then the notes you like or would rather avoid. Every match comes with the reasons it fits —
          plain scoring, no guesswork.
        </p>
      </div>
      <Suspense fallback={<FinderSkeleton />}>
        <FinderLoader />
      </Suspense>
    </div>
  );
}

async function FinderLoader() {
  const [perfumes, ...setProducts] = await Promise.all([getPerfumeProfiles(), ...SET_HANDLES.map((h) => getProduct(h))]);
  const sets: FinderSet[] = setProducts.flatMap((p) =>
    p
      ? [
          {
            handle: p.handle,
            title: p.title,
            price: p.variants[0].price,
            image: p.image ? { url: p.image.url, alt: p.image.alt } : null,
            includes: p.includes.map((i) => i.handle),
          },
        ]
      : [],
  );
  return <Finder perfumes={perfumes} sets={sets} />;
}

function FinderSkeleton() {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-12" role="status" aria-busy="true" aria-label="Loading the finder">
      <div className="space-y-3 lg:col-span-7">
        <div className="h-12 bg-wall/30" />
        <div className="h-10 w-1/2 bg-wall/30" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 bg-wall/25" />
          ))}
        </div>
      </div>
      <div className="h-64 bg-wall/25 lg:col-span-5" />
    </div>
  );
}
