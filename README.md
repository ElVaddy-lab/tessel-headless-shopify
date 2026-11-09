# Tessel — headless Shopify storefront (demo)

A portfolio demo: a custom Next.js storefront for **Tessel**, a fictional niche fragrance brand. Products, cart and checkout live in Shopify and are read through the Storefront API.

**Live demo:** https://tessel-fragrance.vercel.app

> Demo store: the brand and products are fictional, product photos are AI-generated, orders are not fulfilled and payment is test-only.

## What it does

- **Fragrance finder** — four steps (occasion → families → intensity → a mosaic of 46 notes you can like or avoid). Results update on every step and each match says why it fits. Answers live in the URL, so a result can be shared.
- **Catalog** — Search & Discovery filters (type, family, intensity, notes with a search box, availability) and sorting, all in a readable URL: `/collections/perfumes?family=woody&note=vanilla&sort=name`.
- **Product pages** built from metafields and metaobjects: a note pyramid and profile for perfumes, burn time per size for candles, contents for discovery sets, plus "Similar scents" with reasons.
- **Predictive search**, a **cart drawer** (Server Actions, cart ID in an httpOnly cookie) and the **standard Shopify checkout**.
- **Webhooks → cache.** Pages are cached by tag; Shopify webhooks (products, inventory, collections) hit `/api/webhooks/shopify`, which verifies the HMAC signature and revalidates only the affected tags.

## Stack

- Next.js 16 (App Router, Cache Components, Server Actions), React 19, TypeScript, Tailwind CSS 4
- Shopify Storefront API and Admin GraphQL API (2026-10), Search & Discovery, webhooks
- Vercel
- Vitest, Playwright, axe-core

## Project layout

| Path | What's there |
|---|---|
| `src/app/` | Routes: home, `collections/[handle]`, `products/[handle]`, `finder`, `search`, cart actions, search and webhook APIs |
| `src/lib/shopify/` | Storefront client, GraphQL queries and mappers (catalog, product, cart, search) |
| `src/lib/` | Pure logic with unit tests: finder scoring, similar scents, catalog URL ⇄ filters, webhook HMAC |
| `scripts/` | Store setup on the Admin API: data model (`schema.mjs`), catalog seed (`seed.mjs`), webhook registration (`webhooks.mjs`) |
| `scripts/catalog/` | Product, note and vocabulary data used by the seed |
| `e2e/` | Playwright tests: buyer journey and axe checks |

## Run locally

```bash
npm install
cp .env.example .env.local   # store domain, Storefront token, Admin app credentials
npm run dev
```

Setting up a fresh dev store:

```bash
npm run shopify:check     # tokens and scopes work
npm run shopify:schema    # metaobject and metafield definitions
npm run shopify:seed      # notes, products, images, collections
npm run shopify:webhooks -- https://your-deployment.example
```

Search & Discovery filters (type, family, notes, intensity, availability) are configured in the Shopify admin.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright against a local production build; set `BASE_URL` to test a deployment |
| `npm run typecheck` | Route types + TypeScript check |
| `npm run lint` | ESLint |

## Quality

- 66 unit tests, 38 end-to-end tests (desktop 1440 and Pixel 7).
- axe-core, WCAG 2.2 AA + best practices: 0 issues on 15 pages and states, the cart drawer and the search dialog.
- PageSpeed Insights, mobile (9 Nov 2026): Performance 95–100, Accessibility 100, Best Practices 100. SEO is lower on purpose — the demo is `noindex`.

## Known limitations

- Catalog and product pages need JavaScript: their content is in the HTML, but Next.js reveals streamed sections with a script.
- On a Shopify dev store the plain `checkoutUrl` opens the storefront password page; the cart adds `channel=headless-storefronts`, which opens the real checkout.
- Shopify search matches notes only through product descriptions; it does not index metafields.
