import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "./catalog";
import { PRODUCT_CARD_FRAGMENT, toProductCard, type ProductCard, type ProductCardNode } from "./products";
import { storefront } from "./server";

export { normalizeQuery } from "@/lib/search-query";

const PREDICTIVE_QUERY = /* GraphQL */ `
  query Predictive($q: String!, $limit: Int!) {
    predictiveSearch(query: $q, limit: $limit, types: [PRODUCT]) {
      products {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

/** As-you-type suggestions. Cached per query; product changes revalidate via the `products` tag. */
export async function predictiveSearch(query: string, limit = 6): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  if (!query) return [];
  const data = await storefront<{ predictiveSearch: { products: ProductCardNode[] } | null }>({
    query: PREDICTIVE_QUERY,
    variables: { q: query, limit },
  });
  return (data.predictiveSearch?.products ?? []).map(toProductCard);
}

const SEARCH_QUERY = /* GraphQL */ `
  query Search($q: String!) {
    search(query: $q, first: 24, types: [PRODUCT]) {
      totalCount
      nodes {
        ... on Product {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export type SearchResults = { totalCount: number; products: ProductCard[] };

export async function searchProducts(query: string): Promise<SearchResults> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  if (!query) return { totalCount: 0, products: [] };
  const data = await storefront<{ search: { totalCount: number; nodes: ProductCardNode[] } }>({
    query: SEARCH_QUERY,
    variables: { q: query },
  });
  return { totalCount: data.search.totalCount, products: data.search.nodes.map(toProductCard) };
}
