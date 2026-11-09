import { describe, expect, it } from "vitest";
import { similarityReason, similarScents, type ScentProfile } from "./scoring";

const n = (handle: string) => ({ handle, name: handle.charAt(0).toUpperCase() + handle.slice(1) });

const catalog: ScentProfile[] = [
  { handle: "plinth", family: "Woody", notes: [n("pepper"), n("cedarwood"), n("vetiver")] },
  { handle: "lintel", family: "Woody", notes: [n("cardamom"), n("hinoki"), n("sandalwood")] },
  { handle: "clerestory", family: "Citrus", notes: [n("bergamot"), n("cedarwood"), n("musk")] },
  { handle: "mullion", family: "Green", notes: [n("fig"), n("vetiver"), n("musk")] },
  { handle: "quoin", family: "Amber", notes: [n("saffron"), n("vanilla")] },
];

describe("similarScents", () => {
  it("scores shared notes and same family, excluding the product itself", () => {
    const result = similarScents(catalog[0], catalog);
    expect(result.map((r) => [r.product.handle, r.score])).toEqual([
      ["lintel", 2], // same family
      ["clerestory", 1], // cedarwood
      ["mullion", 1], // vetiver
    ]);
    expect(result.find((r) => r.product.handle === "plinth")).toBeUndefined();
  });

  it("drops products with nothing in common and respects the limit", () => {
    const result = similarScents(catalog[4], catalog);
    expect(result).toEqual([]);
    expect(similarScents(catalog[0], catalog, 1)).toHaveLength(1);
  });
});

describe("similarityReason", () => {
  it("explains the match in plain words", () => {
    expect(similarityReason({ sameFamily: true, sharedNotes: [] })).toBe("Same family");
    expect(similarityReason({ sameFamily: false, sharedNotes: [n("cedarwood")] })).toBe("Shares cedarwood");
    expect(similarityReason({ sameFamily: true, sharedNotes: [n("cedarwood"), n("vetiver"), n("musk")] })).toBe(
      "Same family · shares cedarwood, vetiver and musk",
    );
  });
});
