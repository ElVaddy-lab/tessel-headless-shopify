import { NextResponse, type NextRequest } from "next/server";
import { formatPrice } from "@/lib/format";
import { normalizeQuery, predictiveSearch } from "@/lib/shopify/search";

export type Suggestion = {
  handle: string;
  title: string;
  subtitle: string;
  image: string | null;
};

/** Predictive search for the header search box. Read-only, no secrets in the response. */
export async function GET(request: NextRequest) {
  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  if (query.length < 2) return NextResponse.json({ query, suggestions: [] });

  try {
    const products = await predictiveSearch(query);
    const suggestions: Suggestion[] = products.map((p) => ({
      handle: p.handle,
      title: p.title,
      subtitle: `${p.family ?? p.productType} · ${p.hasPriceRange ? "From " : ""}${formatPrice(p.price)}`,
      image: p.image?.url ?? null,
    }));
    return NextResponse.json({ query, suggestions });
  } catch {
    return NextResponse.json({ query, suggestions: [], error: "Search is unavailable right now." }, { status: 502 });
  }
}
