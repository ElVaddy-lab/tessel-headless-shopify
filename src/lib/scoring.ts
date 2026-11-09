/**
 * Transparent scent matching — no AI. Shared by "Similar scents" and (later) the fragrance finder.
 */

export type ScentNote = { handle: string; name: string };

export type ScentProfile = {
  handle: string;
  family: string | null;
  notes: ScentNote[];
};

export type SimilarScent<T extends ScentProfile> = {
  product: T;
  score: number;
  sameFamily: boolean;
  sharedNotes: ScentNote[];
};

export const SIMILARITY_WEIGHTS = { sharedNote: 1, sameFamily: 2 } as const;

/** Ranks other scents by shared notes (+1 each) and same family (+2). Ties keep catalog order. */
export function similarScents<T extends ScentProfile>(target: ScentProfile, candidates: T[], limit = 3): SimilarScent<T>[] {
  const targetNotes = new Set(target.notes.map((n) => n.handle));

  return candidates
    .filter((c) => c.handle !== target.handle)
    .map((product, index) => {
      const sharedNotes = product.notes.filter((n) => targetNotes.has(n.handle));
      const sameFamily = target.family !== null && product.family === target.family;
      const score =
        sharedNotes.length * SIMILARITY_WEIGHTS.sharedNote + (sameFamily ? SIMILARITY_WEIGHTS.sameFamily : 0);
      return { product, score, sameFamily, sharedNotes, index };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ product, score, sameFamily, sharedNotes }) => ({ product, score, sameFamily, sharedNotes }));
}

/** Plain-language reason, e.g. "Same family · shares bergamot and cedarwood". */
export function similarityReason(match: { sameFamily: boolean; sharedNotes: ScentNote[] }): string {
  const parts: string[] = [];
  if (match.sameFamily) parts.push("Same family");
  const names = match.sharedNotes.map((n) => n.name.toLowerCase());
  if (names.length === 1) parts.push(`shares ${names[0]}`);
  else if (names.length > 1) parts.push(`shares ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
