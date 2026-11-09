# Tessel — headless Shopify storefront (demo)

A portfolio demo: a custom Next.js storefront for **Tessel**, a fictional niche fragrance brand. Products, cart and checkout live in Shopify and are read through the Storefront API.

> Demo store: the brand and products are fictional, orders are not fulfilled.

**Status:** early skeleton. Full write-up (architecture, tests, measured performance) comes when the store is finished.

## Stack

- Next.js (App Router, Cache Components) + TypeScript + Tailwind CSS
- Shopify Storefront API (GraphQL), standard Shopify checkout
- Vitest for unit tests

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in store domain and Storefront token
npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Route types + TypeScript check |
| `npm run lint` | ESLint |
