import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { IntensityScale } from "@/components/intensity-scale";
import { NoteTile } from "@/components/note-tile";
import { ProductCard } from "@/components/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { similarityReason, similarScents } from "@/lib/scoring";
import { getPerfumeProfiles, getProduct, getProductHandles } from "@/lib/shopify/catalog";
import type { Note, ProductDetail } from "@/lib/shopify/product-detail";

const COLLECTION_BY_TYPE: Record<string, { href: string; label: string }> = {
  "Eau de Parfum": { href: "/collections/perfumes", label: "Eaux de parfum" },
  "Discovery Set": { href: "/collections/discovery-sets", label: "Discovery sets" },
  Candle: { href: "/collections/home-fragrance", label: "Home fragrance" },
  Diffuser: { href: "/collections/home-fragrance", label: "Home fragrance" },
  "Gift Set": { href: "/collections/gifts", label: "Gifts" },
};

export async function generateStaticParams() {
  const handles = await getProductHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      title: `${product.title} · Tessel`,
      description: product.seo.description,
      images: product.image ? [{ url: product.image.url, width: product.image.width, height: product.image.height, alt: product.image.alt }] : [],
    },
  };
}

export default function ProductPage(props: PageProps<"/products/[handle]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={props.params} />
    </Suspense>
  );
}

async function ProductView({ params }: Pick<PageProps<"/products/[handle]">, "params">) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const collection = COLLECTION_BY_TYPE[product.productType];
  const isPerfume = product.productType === "Eau de Parfum";

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="container-page pt-6 pb-20 lg:pt-10 lg:pb-28">
        {collection ? (
          <nav aria-label="Breadcrumb" className="label text-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <Link href={collection.href} className="underline-offset-4 hover:underline">
                  {collection.label}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {product.title}
              </li>
            </ol>
          </nav>
        ) : null}

        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="lg:sticky lg:top-6">
              <div className="relative aspect-[3/4] overflow-hidden bg-wall">
                {product.image ? (
                  <Image
                    src={product.image.url}
                    alt={product.image.alt}
                    fill
                    priority
                    sizes="(min-width: 80rem) 55vw, (min-width: 64rem) 48vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-5">
            <p className="label text-muted">
              {[product.family, product.concentration ?? product.productType].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-2 text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.02em]">
              {product.title}
            </h1>
            <div
              className="mt-5 max-w-[56ch] text-base leading-relaxed text-muted [&_p+p]:mt-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />

            <div className="mt-8">
              <ProductPurchase title={product.title} optionName={product.optionName} variants={product.variants} />
            </div>

            {isPerfume ? <PerfumeDetails product={product} /> : null}
            {product.productType === "Candle" || product.productType === "Diffuser" ? <HomeDetails product={product} /> : null}
            {product.packaging.length ? (
              <DetailBlock title="Packaging">
                <List items={product.packaging} />
              </DetailBlock>
            ) : null}
          </div>
        </div>

        {product.includes.length ? <Includes product={product} /> : null}
        {isPerfume ? <SimilarScents product={product} /> : null}
      </div>
    </>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="label text-muted">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-ink" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function NoteRow({ label, notes }: { label: string; notes: Note[] }) {
  if (!notes.length) return null;
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-t border-line py-3 first:border-t-0">
      <h3 className="label pt-1 text-muted">{label}</h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {notes.map((note) => (
          <li key={note.handle}>
            <NoteTile name={note.name} group={note.group} description={note.description} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Spec({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-t border-line py-2.5 text-sm">
      <dt className="label pt-0.5 text-muted">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function PerfumeDetails({ product }: { product: ProductDetail }) {
  return (
    <>
      <DetailBlock title="Notes">
        <div>
          <NoteRow label="Top" notes={product.pyramid.top} />
          <NoteRow label="Heart" notes={product.pyramid.heart} />
          <NoteRow label="Base" notes={product.pyramid.base} />
        </div>
      </DetailBlock>
      <DetailBlock title="Profile">
        <dl className="border-b border-line">
          {product.family ? <Spec term="Family">{product.family}</Spec> : null}
          {product.intensity ? (
            <Spec term="Intensity">
              <span className="flex items-center gap-3">
                <IntensityScale value={product.intensity} />
                <span>{["Light", "Moderate", "Intense"][product.intensity - 1]}</span>
              </span>
            </Spec>
          ) : null}
          {product.longevity ? <Spec term="Longevity">{product.longevity}</Spec> : null}
          {product.sillage ? <Spec term="Sillage">{product.sillage}</Spec> : null}
          {product.seasons.length ? <Spec term="Seasons">{product.seasons.join(", ")}</Spec> : null}
          {product.occasions.length ? <Spec term="Wear it for">{product.occasions.join(", ")}</Spec> : null}
          {product.concentration ? <Spec term="Concentration">{product.concentration}</Spec> : null}
        </dl>
      </DetailBlock>
    </>
  );
}

function HomeDetails({ product }: { product: ProductDetail }) {
  return (
    <>
      {product.notes.length ? (
        <DetailBlock title="Key notes">
          <ul className="grid grid-cols-3 gap-2">
            {product.notes.map((note) => (
              <li key={note.handle}>
                <NoteTile name={note.name} group={note.group} size="sm" />
              </li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}
      {product.durationWeeks ? (
        <DetailBlock title="Lasts">
          <p className="text-sm">About {product.durationWeeks} weeks in an average room.</p>
        </DetailBlock>
      ) : null}
      {product.materials.length ? (
        <DetailBlock title="Materials">
          <List items={product.materials} />
        </DetailBlock>
      ) : null}
      {product.howToUse.length ? (
        <DetailBlock title="How to use">
          <List items={product.howToUse} />
        </DetailBlock>
      ) : null}
    </>
  );
}

function Includes({ product }: { product: ProductDetail }) {
  return (
    <section aria-labelledby="includes-title" className="mt-20 lg:mt-28">
      <div className="border-b border-line pb-4">
        <p className="label text-muted">{product.productType === "Discovery Set" ? "5 × 2 ml" : "In the box"}</p>
        <h2 id="includes-title" className="mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-medium">
          What’s inside
        </h2>
      </div>
      <ul className="grid grid-cols-2 border-l border-line sm:grid-cols-3 lg:grid-cols-5">
        {product.includes.map((item) => (
          <li key={item.handle} className="border-r border-b border-line">
            <ProductCard product={item} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 31vw, 48vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function SimilarScents({ product }: { product: ProductDetail }) {
  const perfumes = await getPerfumeProfiles();
  const matches = similarScents(
    { handle: product.handle, family: product.family, notes: product.notes },
    perfumes,
    3,
  );
  if (!matches.length) return null;

  return (
    <section aria-labelledby="similar-title" className="mt-20 lg:mt-28">
      <div className="border-b border-line pb-4">
        <p className="label text-muted">Shared notes and family</p>
        <h2 id="similar-title" className="mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-medium">
          Similar scents
        </h2>
      </div>
      <ul className="grid border-l border-line sm:grid-cols-3">
        {matches.map((match) => (
          <li key={match.product.handle} className="flex flex-col border-r border-b border-line">
            <ProductCard product={match.product} sizes="(min-width: 40rem) 30vw, 92vw" />
            <p className="px-3 pb-4 text-sm text-muted sm:px-4">{similarityReason(match)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductJsonLd({ product }: { product: ProductDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.image?.url,
    brand: { "@type": "Brand", name: "Tessel" },
    category: product.productType,
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku ?? undefined,
      name: v.option ?? product.title,
      price: Number(v.price.amount).toFixed(2),
      priceCurrency: v.price.currencyCode,
      availability: v.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 pt-16 pb-20 lg:grid-cols-12" role="status" aria-busy="true" aria-label="Loading product">
      <div className="aspect-[3/4] bg-wall/40 lg:col-span-6 xl:col-span-7" />
      <div className="space-y-4 lg:col-span-6 xl:col-span-5">
        <div className="h-4 w-32 bg-wall/40" />
        <div className="h-12 w-2/3 bg-wall/40" />
        <div className="h-24 bg-wall/30" />
      </div>
    </div>
  );
}
