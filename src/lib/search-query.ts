export const MAX_QUERY_LENGTH = 60;

/** Trims, collapses spaces and caps length; empty means "no search". */
export function normalizeQuery(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}
