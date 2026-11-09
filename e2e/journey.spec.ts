import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The main path from PLAN.md: home → finder → product → add to bag → change quantity
 * → checkout. Stops at Shopify's checkout page; nothing is paid.
 */
test("home → finder → product → bag → checkout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Find your scent" }).first().click();
  await expect(page).toHaveURL(/\/finder/);

  // Step 1: occasion. Answers go into the URL so a result can be shared.
  await page.getByRole("radio", { name: /Evening/ }).check();
  await expect(page).toHaveURL(/occasion=evening/);
  await page.getByRole("button", { name: /^Next:/ }).click();

  // Step 2: family.
  await page.getByRole("checkbox", { name: /Amber/ }).check();
  await expect(page).toHaveURL(/family=amber/);

  const results = page.getByRole("complementary", { name: "Your matches" });
  const best = results.getByRole("listitem").filter({ hasText: "Best match" });
  await expect(best).toContainText("Amber");
  const bestLink = best.getByRole("heading").getByRole("link");
  const bestName = (await bestLink.textContent())!.trim();

  await bestLink.click();
  await expect(page.getByRole("heading", { level: 1, name: bestName })).toBeVisible();

  // Pick 50 ml and add it.
  // The radio itself is visually hidden inside its label, as in most size pickers.
  await page.locator("label").filter({ has: page.getByRole("radio", { name: /50 ml/ }) }).click();
  await expect(page.getByRole("radio", { name: /50 ml/ })).toBeChecked();
  await page.getByRole("button", { name: "Add to bag" }).click();

  const bag = page.getByRole("dialog", { name: /bag/i });
  await expect(bag).toBeVisible();
  await expect(bag.getByRole("link", { name: bestName })).toBeVisible();
  await expect(bag).toContainText("$135");

  // Quantity 1 → 2 updates the subtotal.
  await bag.getByRole("button", { name: `Increase quantity of ${bestName}, 50 ml` }).click();
  await expect(bag).toContainText("$270");

  // Axe on the open drawer, too.
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  // Checkout link goes to Shopify with the headless channel (skips the dev-store password page).
  const checkout = bag.getByRole("link", { name: "Checkout" });
  await expect(checkout).toHaveAttribute("href", /channel=headless-storefronts/);
  await checkout.click();
  await expect(page).toHaveURL(/\/checkouts\//, { timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/password/);
});

test("filters, notes search and sort keep each other", async ({ page }, testInfo) => {
  await page.goto("/collections/perfumes");
  await page.waitForLoadState("networkidle");
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: /^Filters/ }).click();

  await page.locator("summary", { hasText: "Notes" }).click();
  await page.getByRole("searchbox", { name: "Search notes" }).fill("vanil");
  await page.getByRole("checkbox", { name: /Vanilla/ }).check();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/note=vanilla/);
  await expect(page.getByRole("heading", { name: "2 products" })).toBeVisible();

  await page.getByLabel("Sort by").selectOption("name");
  await expect(page).toHaveURL(/sort=name/);
  await expect(page).toHaveURL(/note=vanilla/);
  const titles = await page.getByRole("region", { name: /products/ }).getByRole("heading", { level: 3 }).allTextContents();
  expect(titles).toEqual([...titles].sort());
});
