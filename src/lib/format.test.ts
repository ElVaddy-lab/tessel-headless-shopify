import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("drops cents for whole amounts", () => {
    expect(formatPrice({ amount: "38.0", currencyCode: "USD" })).toBe("$38");
    expect(formatPrice({ amount: "195.00", currencyCode: "USD" })).toBe("$195");
  });

  it("keeps cents otherwise", () => {
    expect(formatPrice({ amount: "34.5", currencyCode: "USD" })).toBe("$34.50");
  });
});
