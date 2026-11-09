import Link from "next/link";
import { DEMO_NOTICE_TEXT } from "./demo-notice";

const LINKS = [
  { href: "/collections/perfumes", label: "Fragrances" },
  { href: "/collections/discovery-sets", label: "Discovery sets" },
  { href: "/collections/home-fragrance", label: "Home fragrance" },
  { href: "/collections/gifts", label: "Gifts" },
  { href: "/finder", label: "Find your scent" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-lg font-medium tracking-[0.3em] uppercase">Tessel</p>
          <p className="mt-4 max-w-md text-sm text-muted">
            A portfolio demo of a headless Shopify storefront built with Next.js. {DEMO_NOTICE_TEXT}
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-4 md:col-start-9">
          <p className="label text-muted">Shop</p>
          <ul className="mt-3 space-y-1 text-sm">
            {LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1 underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
