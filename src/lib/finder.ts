/**
 * Fragrance finder: transparent point scoring over product metafields — no AI.
 * Pure functions, shared by the /finder UI and unit tests.
 */

export const OCCASIONS = ["Everyday", "Work", "Evening", "Weekend"] as const;
export const FAMILIES = ["Citrus", "Floral", "Woody", "Amber", "Fresh", "Gourmand", "Green"] as const;
export const INTENSITY_LABELS = { 1: "Light", 2: "Moderate", 3: "Intense" } as const;

export type Intensity = 1 | 2 | 3;

export type FinderAnswers = {
  occasion: string | null;
  families: string[];
  intensity: Intensity | null;
  /** Note handles. */
  like: string[];
  avoid: string[];
};

export type FinderNote = { handle: string; name: string };

export type FinderCandidate = {
  handle: string;
  family: string | null;
  intensity: Intensity | null;
  occasions: string[];
  notes: FinderNote[];
};

export const FINDER_WEIGHTS = {
  family: 3,
  intensityExact: 2,
  intensityNear: 1,
  occasion: 2,
  likedNote: 2,
  avoidedNote: -4,
} as const;

export type FinderMatch<T extends FinderCandidate> = {
  product: T;
  score: number;
  /** Plain-language reasons, positives first. */
  reasons: string[];
  /** Avoided notes the scent still contains (shown as a warning). */
  warnings: string[];
};

export const EMPTY_ANSWERS: FinderAnswers = { occasion: null, families: [], intensity: null, like: [], avoid: [] };

export function hasAnswers(a: FinderAnswers): boolean {
  return Boolean(a.occasion || a.families.length || a.intensity || a.like.length || a.avoid.length);
}

function listWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

export function scoreCandidate<T extends FinderCandidate>(product: T, answers: FinderAnswers): FinderMatch<T> {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (product.family && answers.families.includes(product.family)) {
    score += FINDER_WEIGHTS.family;
    reasons.push(`${product.family}, a family you picked`);
  }

  if (answers.intensity && product.intensity) {
    const diff = Math.abs(answers.intensity - product.intensity);
    if (diff === 0) {
      score += FINDER_WEIGHTS.intensityExact;
      reasons.push(`${INTENSITY_LABELS[product.intensity]}, as you asked`);
    } else if (diff === 1) {
      score += FINDER_WEIGHTS.intensityNear;
      reasons.push(`${INTENSITY_LABELS[product.intensity]}, close to what you asked`);
    }
  }

  if (answers.occasion && product.occasions.includes(answers.occasion)) {
    score += FINDER_WEIGHTS.occasion;
    reasons.push(`Made for ${answers.occasion === "Everyday" ? "every day" : answers.occasion.toLowerCase()}`);
  }

  const liked = product.notes.filter((n) => answers.like.includes(n.handle));
  if (liked.length) {
    score += liked.length * FINDER_WEIGHTS.likedNote;
    reasons.push(`Has ${listWords(liked.map((n) => n.name.toLowerCase()))}, which you like`);
  }

  const avoided = product.notes.filter((n) => answers.avoid.includes(n.handle));
  if (avoided.length) {
    score += avoided.length * FINDER_WEIGHTS.avoidedNote;
    warnings.push(`Contains ${listWords(avoided.map((n) => n.name.toLowerCase()))}, which you’d rather avoid`);
  }

  return { product, score, reasons, warnings };
}

/** Top matches with a positive score; ties keep catalog order. */
export function rankScents<T extends FinderCandidate>(candidates: T[], answers: FinderAnswers, limit = 3): FinderMatch<T>[] {
  if (!hasAnswers(answers)) return [];
  return candidates
    .map((c, index) => ({ match: scoreCandidate(c, answers), index }))
    .filter(({ match }) => match.score > 0)
    .sort((a, b) => b.match.score - a.match.score || a.index - b.index)
    .slice(0, limit)
    .map(({ match }) => match);
}

/** The discovery set that contains most of the matches (first one wins a tie). */
export function suggestSet<S extends { handle: string; includes: string[] }>(sets: S[], matchHandles: string[]): S | null {
  let best: S | null = null;
  let bestCount = 0;
  for (const set of sets) {
    const count = matchHandles.filter((h) => set.includes.includes(h)).length;
    if (count > bestCount) {
      best = set;
      bestCount = count;
    }
  }
  return best;
}

/* ---------- URL state (shareable result) ---------- */

type SearchParamsLike = { get(name: string): string | null; getAll(name: string): string[] };

export function answersFromParams(params: SearchParamsLike, known: { notes: Set<string> }): FinderAnswers {
  const occasion = params.get("occasion");
  const intensity = Number(params.get("intensity"));
  const unique = (values: string[]) => [...new Set(values)];
  const like = unique(params.getAll("like").filter((h) => known.notes.has(h)));
  return {
    occasion: OCCASIONS.find((o) => o.toLowerCase() === occasion?.toLowerCase()) ?? null,
    families: unique(
      params
        .getAll("family")
        .map((f) => FAMILIES.find((x) => x.toLowerCase() === f.toLowerCase()))
        .filter((f): f is (typeof FAMILIES)[number] => Boolean(f)),
    ),
    intensity: intensity === 1 || intensity === 2 || intensity === 3 ? intensity : null,
    like,
    avoid: unique(params.getAll("avoid").filter((h) => known.notes.has(h) && !like.includes(h))),
  };
}

export function answersToQuery(a: FinderAnswers): string {
  const sp = new URLSearchParams();
  if (a.occasion) sp.set("occasion", a.occasion.toLowerCase());
  for (const f of a.families) sp.append("family", f.toLowerCase());
  if (a.intensity) sp.set("intensity", String(a.intensity));
  for (const h of a.like) sp.append("like", h);
  for (const h of a.avoid) sp.append("avoid", h);
  return sp.toString();
}

/** Marks a note as liked/avoided, or clears it when it already has that state. */
export function toggleNote(a: FinderAnswers, handle: string, mode: "like" | "avoid"): FinderAnswers {
  const other = mode === "like" ? "avoid" : "like";
  const active = a[mode].includes(handle);
  return {
    ...a,
    [mode]: active ? a[mode].filter((h) => h !== handle) : [...a[mode], handle],
    [other]: a[other].filter((h) => h !== handle),
  };
}
