// Registers the cache-invalidation webhooks for the deployed storefront.
// Idempotent: existing subscriptions to the same URL are kept, stale URLs for our topics are moved.
// Webhooks created by this app are signed with its client secret (SHOPIFY_ADMIN_CLIENT_SECRET).
//
//   node scripts/webhooks.mjs https://your-site.vercel.app
//   node scripts/webhooks.mjs --list

import { check, gql } from './admin.mjs';

const TOPICS = [
  'PRODUCTS_CREATE',
  'PRODUCTS_UPDATE',
  'PRODUCTS_DELETE',
  'INVENTORY_LEVELS_UPDATE',
  'COLLECTIONS_CREATE',
  'COLLECTIONS_UPDATE',
  'COLLECTIONS_DELETE',
];

const existing = async () =>
  (await gql(`{ webhookSubscriptions(first: 50) { nodes { id topic uri } } }`)).webhookSubscriptions.nodes;

const arg = process.argv[2];

if (!arg || arg === '--list') {
  for (const w of await existing()) console.log(`${w.topic.padEnd(26)} ${w.uri}`);
  if (!arg) console.log('\nUsage: node scripts/webhooks.mjs https://your-site.example');
  process.exit(0);
}

const base = new URL(arg);
if (base.protocol !== 'https:') throw new Error('Shopify only delivers webhooks to https URLs');
const uri = new URL('/api/webhooks/shopify', base).toString();

const current = await existing();
for (const topic of TOPICS) {
  const subs = current.filter((w) => w.topic === topic);
  if (subs.some((w) => w.uri === uri)) {
    console.log(`  ${topic.padEnd(26)} exists`);
    continue;
  }
  if (subs.length) {
    const r = await gql(
      `mutation($id: ID!, $sub: WebhookSubscriptionInput!) {
        webhookSubscriptionUpdate(id: $id, webhookSubscription: $sub) { userErrors { field message } }
      }`,
      { id: subs[0].id, sub: { uri } },
    );
    check(r.webhookSubscriptionUpdate, `update ${topic}`);
    console.log(`  ${topic.padEnd(26)} moved to ${uri}`);
    continue;
  }
  const r = await gql(
    `mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
        webhookSubscription { id }
        userErrors { field message }
      }
    }`,
    { topic, sub: { uri, format: 'JSON' } },
  );
  check(r.webhookSubscriptionCreate, `create ${topic}`);
  console.log(`  ${topic.padEnd(26)} created`);
}
