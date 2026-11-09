// Smoke test for store access: Admin API (setup app) and Storefront API (private + public tokens).
// Prints store facts and scopes only, never tokens.

import { API_VERSION, gql } from './admin.mjs';

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');

async function storefront(headerName, tokenValue, query) {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [headerName]: tokenValue },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status} ${text.slice(0, 200)}` };
  const body = JSON.parse(text);
  if (body.errors) return { ok: false, detail: JSON.stringify(body.errors).slice(0, 400) };
  return { ok: true, data: body.data };
}

console.log(`Store: ${DOMAIN}, API ${API_VERSION}\n`);

// --- Admin API
try {
  const data = await gql(`#graphql
    {
      shop { name currencyCode plan { partnerDevelopment shopifyPlus } }
      currentAppInstallation { accessScopes { handle } }
      publications(first: 20) { nodes { name } }
      productsCount { count }
    }`);
  const { shop, currentAppInstallation, publications, productsCount } = data;
  console.log('Admin API: OK');
  console.log(`  shop: ${shop.name}, currency ${shop.currencyCode}, dev store: ${shop.plan.partnerDevelopment}`);
  console.log(`  scopes: ${currentAppInstallation.accessScopes.map((s) => s.handle).join(', ')}`);
  console.log(`  sales channels (publications): ${publications.nodes.map((p) => p.name).join(', ')}`);
  console.log(`  products: ${productsCount.count}`);
} catch (error) {
  console.log(`Admin API: FAILED\n  ${error.message}`);
}

// --- Storefront API
const query = '{ shop { name paymentSettings { currencyCode } } products(first: 1) { nodes { id } } }';
const checks = [
  ['private token', 'Shopify-Storefront-Private-Token', process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN],
  ['public token', 'X-Shopify-Storefront-Access-Token', process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN],
];
for (const [label, header, value] of checks) {
  if (!value) {
    console.log(`\nStorefront API (${label}): not set`);
    continue;
  }
  const result = await storefront(header, value, query);
  console.log(`\nStorefront API (${label}): ${result.ok ? 'OK' : 'FAILED'}`);
  if (result.ok) {
    const { shop, products } = result.data;
    console.log(`  shop: ${shop.name}, currency ${shop.paymentSettings.currencyCode}, visible products: ${products.nodes.length}`);
  } else {
    console.log(`  ${result.detail}`);
  }
}
