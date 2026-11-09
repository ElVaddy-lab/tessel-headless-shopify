import { cacheLife, cacheTag } from "next/cache";
import { PRODUCT_CARD_FRAGMENT, toProductCard, type ProductCard, type ProductCardNode } from "./products";
import { storefront } from "./server";

/** Cache tags; Shopify webhooks (stage 15) revalidate these. */
export const TAGS = {
  products: "products",
  collections: "collections",
  collection: (handle: string) => `collection:${handle}`,
};

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
