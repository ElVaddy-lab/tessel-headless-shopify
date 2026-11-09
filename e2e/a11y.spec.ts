import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** WCAG 2.2 AA plus axe best practices; any violation fails with a readable list. */
async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary).toEqual([]);
}

/** Pages stream their content; wait for the main heading and for the page to settle. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("h1").first()).toBeVisible();
  // networkidle ≈ hydrated, so clicks below reach React handlers.
  await page.waitForLoadState("networkidle");
}

const PAGES: [string, string][] = [
  ["home", "/"],
  ["collection", "/collections/perfumes"],
  ["collection with filters", "/collections/perfumes?family=amber&note=vanilla&sort=name"],
  ["collection, empty result", "/collections/perfumes?family=citrus&note=vanilla"],
  ["collection with price sort", "/collections/gifts"],
  ["perfume", "/products/quoin"],
  ["discovery set", "/products/discovery-set-light"],
  ["candle", "/products/architrave-candle"],
  ["diffuser", "/products/clerestory-diffuser"],
  ["gift box", "/products/evening-gift-box"],
  ["finder, empty", "/finder"],
  ["finder with answers", "/finder?occasion=evening&family=amber&like=vanilla&avoid=myrrh"],
  ["search results", "/search?q=vanilla"],
  ["search, nothing found", "/search?q=zzzz"],
  ["not found", "/products/does-not-exist"],
];

for (const [name, path] of PAGES) {
  test(`axe: ${name}`, async ({ page }) => {
    await open(page, path);
    await expectNoViolations(page);
  });
}

test("axe: filters expanded, notes searched", async ({ page }, testInfo) => {
  await open(page, "/collections/perfumes");
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: /^Filters/ }).click();
  await page.locator("summary", { hasText: "Notes" }).click();
  await page.getByRole("searchbox", { name: "Search notes" }).fill("ce");
  await expect(page.getByRole("checkbox", { name: /Cedarwood/ })).toBeVisible();
  await expectNoViolations(page);
});

test("axe: search dialog with suggestions", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("link", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("vanil");
  await expect(page.getByRole("list", { name: "Suggestions" })).toBeVisible();
  await expectNoViolations(page);
});
