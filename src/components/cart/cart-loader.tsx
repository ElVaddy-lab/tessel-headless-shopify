import { loadCart } from "@/app/actions/cart";
import { CartDrawer } from "./cart-drawer";

/** Reads the cart cookie at request time; rendered inside <Suspense> in the header. */
export async function CartLoader() {
  const cart = await loadCart();
  return <CartDrawer initialCart={cart} />;
}

export function CartButtonFallback() {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 px-1 text-sm" aria-hidden="true">
      Bag <span className="inline-flex min-w-6 justify-center bg-ink/20 px-1.5 text-xs">&nbsp;</span>
    </span>
  );
}
