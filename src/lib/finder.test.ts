import { describe, expect, it } from "vitest";
import {
  answersFromParams,
  answersToQuery,
  EMPTY_ANSWERS,
  rankScents,
  scoreCandidate,
  suggestSet,
  toggleNote,
  type FinderAnswers,
  type FinderCandidate,
} from "./finder";

const n = (handle: string) => ({ handle, name: handle.replace("-", " ").replace(/^./, (c) => c.toUpperCase()) });

const catalog: FinderCandidate[] = [
  { handle: "clerestory", family: "Citrus", intensity: 1, occasions: ["Everyday", "Work"], notes: [n("bergamot"), n("neroli"), n("white-musk")] },
  { handle: "architrave", family: "Amber", intensity: 3, occasions: ["Evening"], notes: [n("olibanum"), n("myrrh"), n("amber")] },
  { handle: "quoin", family: "Amber", intensity: 3, occasions: ["Evening", "Weekend"], notes: [n("saffron"), n("rose"), n("vanilla")] },
  { handle: "cornice", family: "Gourmand", intensity: 2, occasions: ["Weekend", "Evening"], notes: [n("pear"), n("vanilla"), n("tonka-bean")] },
  { handle: "transom", family: "Fresh", intensity: 1, occasions: ["Everyday"], notes: [n("sea-salt"), n("mint")] },
];

const answers = (patch: Partial<FinderAnswers>): FinderAnswers => ({ ...EMPTY_ANSWERS, ...patch });

describe("scoreCandidate", () => {
  it("adds family, exact intensity, occasion and liked notes, with reasons", () => {
    const m = scoreCandidate(catalog[2], answers({ families: ["Amber"], intensity: 3, occasion: "Evening", like: ["vanilla", "rose"] }));
    expect(m.score).toBe(3 + 2 + 2 + 2 * 2);
    expect(m.reasons).toEqual([
      "Amber, a family you picked",
      "Intense, as you asked",
      "Made for evening",
      "Has rose and vanilla, which you like",
    ]);
    expect(m.warnings).toEqual([]);
  });

  it("gives a near-intensity point and subtracts avoided notes with a warning", () => {
    const m = scoreCandidate(catalog[3], answers({ intensity: 3, avoid: ["vanilla"] }));
    expect(m.score).toBe(1 - 4);
    expect(m.reasons).toEqual(["Moderate, close to what you asked"]);
    expect(m.warnings).toEqual(["Contains vanilla, which you’d rather avoid"]);
  });
});

describe("rankScents", () => {
  it("returns nothing until something is answered", () => {
    expect(rankScents(catalog, EMPTY_ANSWERS)).toEqual([]);
  });

  it("ranks by score, drops non-positive scores and keeps catalog order on ties", () => {
    const result = rankScents(catalog, answers({ occasion: "Evening", avoid: ["olibanum"] }));
    expect(result.map((m) => [m.product.handle, m.score])).toEqual([
      ["quoin", 2],
      ["cornice", 2],
    ]);
  });

  it("limits the result", () => {
    expect(rankScents(catalog, answers({ occasion: "Everyday", families: ["Citrus", "Fresh", "Amber"] }), 2)).toHaveLength(2);
  });
});

describe("suggestSet", () => {
  const sets = [
    { handle: "light", includes: ["clerestory", "transom"] },
    { handle: "deep", includes: ["architrave", "quoin", "cornice"] },
  ];

  it("picks the set holding most matches", () => {
    expect(suggestSet(sets, ["quoin", "cornice", "transom"])?.handle).toBe("deep");
    expect(suggestSet(sets, [])).toBeNull();
  });
});

describe("URL state", () => {
  const known = { notes: new Set(["vanilla", "mint", "rose"]) };

  it("round-trips answers through the query string", () => {
    const a = answers({ occasion: "Evening", families: ["Amber", "Woody"], intensity: 3, like: ["vanilla"], avoid: ["mint"] });
    const query = answersToQuery(a);
    expect(query).toBe("occasion=evening&family=amber&family=woody&intensity=3&like=vanilla&avoid=mint");
    expect(answersFromParams(new URLSearchParams(query), known)).toEqual(a);
  });

  it("ignores unknown values and a note that is both liked and avoided", () => {
    const parsed = answersFromParams(
      new URLSearchParams("occasion=party&family=smoky&intensity=9&like=rose&like=unicorn&avoid=rose"),
      known,
    );
    expect(parsed).toEqual(answers({ like: ["rose"] }));
  });
});

describe("toggleNote", () => {
  it("moves a note between like and avoid and clears it on a second press", () => {
    let a = toggleNote(EMPTY_ANSWERS, "vanilla", "like");
    expect(a.like).toEqual(["vanilla"]);
    a = toggleNote(a, "vanilla", "avoid");
    expect([a.like, a.avoid]).toEqual([[], ["vanilla"]]);
    a = toggleNote(a, "vanilla", "avoid");
    expect(a.avoid).toEqual([]);
  });
});
