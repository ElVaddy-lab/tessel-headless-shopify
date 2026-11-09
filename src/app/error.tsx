"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page py-24" aria-labelledby="error-title">
      <p className="label text-muted">Something went wrong</p>
      <h1 id="error-title" className="mt-2 text-3xl font-medium">
        This page couldn’t load.
      </h1>
      <p className="mt-4 max-w-[50ch] text-muted">The store didn’t answer in time. It’s usually temporary.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 inline-flex min-h-12 items-center bg-ink px-6 text-sm text-paper hover:bg-ink/85"
      >
        Try again
      </button>
    </section>
  );
}
