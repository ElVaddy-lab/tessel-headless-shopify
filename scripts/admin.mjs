// Admin GraphQL client for the store setup scripts.
// Token: client credentials grant of the Dev Dashboard app "Tessel setup".
// Credentials come from .env.local (see .env.example). Tokens are never printed.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const envFile = join(ROOT, '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/+$/, '');
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
export const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2026-10';

if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Fill SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID and SHOPIFY_ADMIN_CLIENT_SECRET in .env.local');
}

let token = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (token && Date.now() < tokenExpiresAt - 60_000) return token;
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) {
    const text = await res.text();
    const reason = text.match(/<title>(.*?)<\/title>/)?.[1] ?? text.slice(0, 300);
    throw new Error(`Admin token request failed: ${res.status} ${reason}`);
  }
  const body = await res.json();
  token = body.access_token;
  tokenExpiresAt = Date.now() + (body.expires_in ?? 3600) * 1000;
  return token;
}

export async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await getToken() },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Admin GraphQL HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const { data, errors } = await res.json();
    if (errors?.some((e) => e.extensions?.code === 'THROTTLED') && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (errors) throw new Error(JSON.stringify(errors, null, 2));
    return data;
  }
}

// Throws on mutation userErrors so a failed step is never silent.
export function check(payload, label) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${JSON.stringify(errs)}`);
  return payload;
}
