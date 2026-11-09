"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Suggestion } from "@/app/api/search/route";

/**
 * Header search. Without JavaScript it is a plain link to /search; with it, a dialog
 * with as-you-type suggestions (Storefront predictive search). Enter opens full results.
 */
export function SearchDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // Result of the last finished request, remembered with the query it answers.
  const [result, setResult] = useState<{ q: string; suggestions: Suggestion[]; ok: boolean } | null>(null);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data: { suggestions: Suggestion[] } = await res.json();
        setResult({ q, suggestions: data.suggestions, ok: res.ok });
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResult({ q, suggestions: [], ok: false });
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const current = q.length >= 2 && result?.q === q ? result : null;
  const status: "idle" | "loading" | "done" | "error" =
    q.length < 2 ? "idle" : !current ? "loading" : current.ok ? "done" : "error";
  const suggestions = current?.suggestions ?? [];

  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Link href="/search" onClick={open} className="inline-flex min-h-11 items-center px-1 text-sm underline-offset-4 hover:underline">
        Search
      </Link>

      <dialog
        ref={dialogRef}
        aria-label="Search the store"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="mx-auto mt-[10vh] w-[min(40rem,calc(100%-2rem))] bg-paper p-0 text-ink backdrop:bg-ink/40"
      >
        <form
          role="search"
          action="/search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q) return;
            close();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
          className="flex items-center gap-2 border-b border-line p-3"
        >
          <label htmlFor="search-input" className="sr-only">
            Search fragrances, notes and candles
          </label>
          <input
            ref={inputRef}
            id="search-input"
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vanilla, Quoin, candle…"
            autoComplete="off"
            aria-describedby="search-status"
            className="min-h-12 flex-1 bg-transparent px-2 text-lg outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
          />
          <button type="button" onClick={close} className="inline-flex size-11 items-center justify-center text-2xl" aria-label="Close search">
            ×
          </button>
        </form>

        <p id="search-status" className="sr-only" aria-live="polite">
          {status === "done" ? `${suggestions.length} ${suggestions.length === 1 ? "suggestion" : "suggestions"}` : ""}
          {status === "error" ? "Search is unavailable right now." : ""}
        </p>

        <div className="max-h-[60vh] overflow-y-auto">
          {status === "done" && suggestions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No products match “{q}”. Try a note, like vanilla or cedar.</p>
          ) : null}
          {status === "error" ? <p className="px-5 py-6 text-sm text-muted">Search is unavailable right now. Try again in a moment.</p> : null}
          {suggestions.length ? (
            <ul aria-label="Suggestions">
              {suggestions.map((s) => (
                <li key={s.handle} className="border-b border-line last:border-b-0">
                  <Link href={`/products/${s.handle}`} onClick={close} className="flex items-center gap-4 px-4 py-3 hover:bg-paper-2">
                    <span className="relative h-16 w-12 shrink-0 bg-wall">
                      {s.image ? <Image src={s.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                    </span>
                    <span>
                      <span className="block font-medium">{s.title}</span>
                      <span className="label block text-muted">{s.subtitle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {q.length >= 2 ? (
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              onClick={close}
              className="block border-t border-line px-5 py-4 text-sm underline underline-offset-4 hover:no-underline"
            >
              See all results for “{q}”
            </Link>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">Type at least two letters — a name, a note or a product type.</p>
          )}
        </div>
      </dialog>
    </>
  );
}
