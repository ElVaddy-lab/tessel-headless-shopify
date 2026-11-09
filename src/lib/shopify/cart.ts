import "server-only";

import { CART_FRAGMENT, toCart, type Cart, type CartNode } from "./cart-model";
import { storefront } from "./server";

type UserError = { field: string[] | null; message: string };
type MutationResult = { cart: CartNode | null; userErrors: UserError[] };

export class CartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartError";
  }
}

function unwrap(result: MutationResult): Cart {
  if (result.userErrors.length) throw new CartError(result.userErrors.map((e) => e.message).join("; "));
  if (!result.cart) throw new CartError("Shopify returned no cart");
  return toCart(result.cart);
}

const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) {
      ...Cart
    }
  }
  ${CART_FRAGMENT}
`;

/** Carts are per shopper and change often: never cached. */
export async function getCart(id: string, buyerIp?: string): Promise<Cart | null> {
  const data = await storefront<{ cart: CartNode | null }>({ query: CART_QUERY, variables: { id }, buyerIp });
  return data.cart ? toCart(data.cart) : null;
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function createCart(lines: { merchandiseId: string; quantity: number }[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartCreate: MutationResult }>({ query: CART_CREATE, variables: { lines }, buyerIp });
  return unwrap(data.cartCreate);
}

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function addLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
  buyerIp?: string,
): Promise<Cart> {
  const data = await storefront<{ cartLinesAdd: MutationResult }>({
    query: CART_LINES_ADD,
    variables: { cartId, lines },
    buyerIp,
  });
  return unwrap(data.cartLinesAdd);
}

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function updateLines(cartId: string, lines: { id: string; quantity: number }[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartLinesUpdate: MutationResult }>({
    query: CART_LINES_UPDATE,
    variables: { cartId, lines },
    buyerIp,
  });
  return unwrap(data.cartLinesUpdate);
}

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function removeLines(cartId: string, lineIds: string[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartLinesRemove: MutationResult }>({
    query: CART_LINES_REMOVE,
    variables: { cartId, lineIds },
    buyerIp,
  });
  return unwrap(data.cartLinesRemove);
}
