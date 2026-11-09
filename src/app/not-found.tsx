import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page py-24" aria-labelledby="nf-title">
      <p className="label text-muted">404</p>
      <h1 id="nf-title" className="mt-2 text-3xl font-medium">
        This page isn’t part of the building.
      </h1>
      <p className="mt-4 max-w-[50ch] text-muted">The product or collection may have moved, or the link is mistyped.</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/collections/perfumes" className="inline-flex min-h-12 items-center bg-ink px-6 text-sm text-paper hover:bg-ink/85">
          Browse fragrances
        </Link>
        <Link href="/" className="inline-flex min-h-12 items-center py-2 text-sm underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </section>
  );
}
