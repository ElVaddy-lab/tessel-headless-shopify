import type { Money } from "@/lib/format";

export const CART_FRAGMENT = /* GraphQL */ `
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image {
              url
              altText
            }
            product {
              handle
              title
              productType
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

type Image = { url: string; altText: string | null } | null;

export type CartNode = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        image: Image;
        product: { handle: string; title: string; productType: string; featuredImage: Image };
      };
    }[];
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  total: Money;
  variantId: string;
  /** "50 ml" — null for single-variant products. */
  variantTitle: string | null;
  availableForSale: boolean;
  product: { handle: string; title: string; productType: string };
  image: { url: string; alt: string } | null;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  lines: CartLine[];
};

/**
 * Development stores keep the storefront password on, and a plain headless checkoutUrl
 * lands on /password. Tagging the checkout with the headless channel opens the real
 * checkout (verified on this store, 2026-11-09).
 */
export function withHeadlessChannel(checkoutUrl: string): string {
  const url = new URL(checkoutUrl);
  url.searchParams.set("channel", "headless-storefronts");
  return url.toString();
}

export function toCart(node: CartNode): Cart {
  return {
    id: node.id,
    checkoutUrl: withHeadlessChannel(node.checkoutUrl),
    totalQuantity: node.totalQuantity,
    subtotal: node.cost.subtotalAmount,
    lines: node.lines.nodes.map((line) => {
      const m = line.merchandise;
      const image = m.image ?? m.product.featuredImage;
      return {
        id: line.id,
        quantity: line.quantity,
        total: line.cost.totalAmount,
        variantId: m.id,
        variantTitle: m.title === "Default Title" ? null : m.title,
        availableForSale: m.availableForSale,
        product: { handle: m.product.handle, title: m.product.title, productType: m.product.productType },
        image: image ? { url: image.url, alt: image.altText || m.product.title } : null,
      };
    }),
  };
}

export const MAX_LINE_QUANTITY = 10;

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.trunc(quantity)));
}
