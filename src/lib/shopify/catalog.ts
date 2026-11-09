import { cacheLife, cacheTag } from "next/cache";
import { SORTS, type ProductFilterInput, type SortId, type StorefrontFilter } from "@/lib/catalog-params";
import { isNoteGroup, type NoteGroup } from "@/lib/notes";
import type { ScentProfile } from "@/lib/scoring";
import { PRODUCT_DETAIL_QUERY, toProductDetail, type ProductDetail, type ProductDetailNode } from "./product-detail";
import { PRODUCT_CARD_FRAGMENT, toProductCard, type ProductCard, type ProductCardNode } from "./products";
import { storefront } from "./server";

/** Cache tags; Shopify webhooks (stage 15) revalidate these. */
export const TAGS = {
  products: "products",
  collections: "collections",
  collection: (handle: string) => `collection:${handle}`,
  product: (handle: string) => `product:${handle}`,
};

/* ---------- Collection listing (home sections) ---------- */

const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      title
      products(first: $first, sortKey: CREATED) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

type CollectionProductsData = {
  collection: { title: string; products: { nodes: ProductCardNode[] } } | null;
};

export type CollectionListing = { title: string; products: ProductCard[] };

/** Products of a collection in creation order. Cached until a webhook revalidates it. */
export async function getCollectionProducts(handle: string, first = 24): Promise<CollectionListing | null> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.collections, TAGS.collection(handle));

  const data = await storefront<CollectionProductsData, { handle: string; first: number }>({
    query: COLLECTION_PRODUCTS_QUERY,
    variables: { handle, first },
  });

  if (!data.collection) return null;
  return {
    title: data.collection.title,
    products: data.collection.products.nodes.map(toProductCard),
  };
}

/* ---------- Collection page: filters + filtered, sorted products ---------- */

const COLLECTION_PAGE_QUERY = /* GraphQL */ `
  query CollectionPage(
    $handle: String!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      title
      description
      all: products(first: 1) {
        filters {
          id
          label
          values {
            label
            count
            input
          }
        }
      }
      products(first: 50, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

type CollectionPageData = {
  collection: {
    title: string;
    description: string;
    all: { filters: StorefrontFilter[] };
    products: { nodes: ProductCardNode[] };
  } | null;
};

export type CollectionPage = {
  title: string;
  description: string;
  /** Filters computed over the whole collection, so options don't vanish as you filter. */
  filters: StorefrontFilter[];
  products: ProductCard[];
};

export async function getCollectionFilters(handle: string): Promise<StorefrontFilter[] | null> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.collections, TAGS.collection(handle));
  const page = await fetchCollectionPage(handle, [], "featured");
  return page?.filters ?? null;
}

export async function getCollectionPage(
  handle: string,
  filters: ProductFilterInput[],
  sort: SortId,
): Promise<CollectionPage | null> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.collections, TAGS.collection(handle));
  return fetchCollectionPage(handle, filters, sort);
}

async function fetchCollectionPage(handle: string, filters: ProductFilterInput[], sort: SortId): Promise<CollectionPage | null> {
  const { sortKey, reverse } = SORTS[sort];
  const data = await storefront<CollectionPageData>({
    query: COLLECTION_PAGE_QUERY,
    variables: { handle, filters, sortKey, reverse },
  });
  if (!data.collection) return null;
  return {
    title: data.collection.title,
    description: data.collection.description,
    filters: data.collection.all.filters,
    products: data.collection.products.nodes.map(toProductCard),
  };
}

const COLLECTION_HANDLES_QUERY = /* GraphQL */ `
  query CollectionHandles {
    collections(first: 20) {
      nodes {
        handle
      }
    }
  }
`;

export async function getCollectionHandles(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.collections);
  const data = await storefront<{ collections: { nodes: { handle: string }[] } }>({ query: COLLECTION_HANDLES_QUERY });
  return data.collections.nodes.map((c) => c.handle).filter((h) => h !== "frontpage");
}

/* ---------- Product page ---------- */

export async function getProduct(handle: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.product(handle));
  const data = await storefront<{ product: ProductDetailNode | null }, { handle: string }>({
    query: PRODUCT_DETAIL_QUERY,
    variables: { handle },
  });
  return data.product ? toProductDetail(data.product) : null;
}

const PRODUCT_HANDLES_QUERY = /* GraphQL */ `
  query ProductHandles {
    products(first: 100) {
      nodes {
        handle
      }
    }
  }
`;

export async function getProductHandles(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products);
  const data = await storefront<{ products: { nodes: { handle: string }[] } }>({ query: PRODUCT_HANDLES_QUERY });
  return data.products.nodes.map((p) => p.handle);
}

/* ---------- Scent profiles (similar scents, finder) ---------- */

const SCENT_PROFILES_QUERY = /* GraphQL */ `
  query ScentProfiles {
    collection(handle: "perfumes") {
      products(first: 50, sortKey: CREATED) {
        nodes {
          ...ProductCard
          notes: metafield(namespace: "custom", key: "notes") {
            references(first: 20) {
              nodes {
                ... on Metaobject {
                  handle
                  name: field(key: "name") {
                    value
                  }
                  group: field(key: "group") {
                    value
                  }
                }
              }
            }
          }
          occasions: metafield(namespace: "custom", key: "occasions") {
            value
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

type ScentProfileNode = ProductCardNode & {
  notes: {
    references: { nodes: { handle: string; name: { value: string } | null; group: { value: string } | null }[] } | null;
  } | null;
  occasions: { value: string } | null;
};

export type ProfileNote = { handle: string; name: string; group: NoteGroup | null };

export type PerfumeProfile = ProductCard & ScentProfile & { notes: ProfileNote[]; occasions: string[] };

function parseList(value: string | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function getPerfumeProfiles(): Promise<PerfumeProfile[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.collection("perfumes"));
  const data = await storefront<{ collection: { products: { nodes: ScentProfileNode[] } } | null }>({
    query: SCENT_PROFILES_QUERY,
  });
  return (data.collection?.products.nodes ?? []).map((node) => ({
    ...toProductCard(node),
    notes: (node.notes?.references?.nodes ?? []).map((n) => ({
      handle: n.handle,
      name: n.name?.value ?? n.handle,
      group: isNoteGroup(n.group?.value) ? (n.group?.value as NoteGroup) : null,
    })),
    occasions: parseList(node.occasions?.value),
  }));
}
