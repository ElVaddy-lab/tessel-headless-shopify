import Link from "next/link";
import { Suspense } from "react";
import { CartButtonFallback, CartLoader } from "./cart/cart-loader";
import { SearchDialog } from "./search/search-dialog";

const NAV = [
  { href: "/collections/perfumes", label: "Fragrances" },
  { href: "/collections/discovery-sets", label: "Discovery sets" },
  { href: "/collections/home-fragrance", label: "Home" },
  { href: "/collections/gifts", label: "Gifts" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4">
        <Link href="/" className="text-lg font-medium tracking-[0.3em] uppercase" aria-label="Tessel, home">
          Tessel
        </Link>
        <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-2 underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <SearchDialog />
          <Link
            href="/finder"
            className="inline-flex min-h-11 items-center border border-ink px-4 text-sm hover:bg-ink hover:text-paper"
          >
            Find your scent
          </Link>
          <Suspense fallback={<CartButtonFallback />}>
            <CartLoader />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
