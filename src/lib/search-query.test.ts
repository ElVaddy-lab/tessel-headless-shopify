import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, normalizeQuery } from "./search-query";

describe("normalizeQuery", () => {
  it("trims, collapses whitespace and takes the first of repeated params", () => {
    expect(normalizeQuery("  fig   leaf ")).toBe("fig leaf");
    expect(normalizeQuery(["vanilla", "rose"])).toBe("vanilla");
    expect(normalizeQuery(undefined)).toBe("");
  });

  it("caps very long queries", () => {
    expect(normalizeQuery("a".repeat(200))).toHaveLength(MAX_QUERY_LENGTH);
  });
});
