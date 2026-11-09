// Fills the store from scripts/catalog: notes → products (+ images, stock) → set contents → collections.
// Idempotent: notes upsert by handle, products upsert by handle (productSet), images are
// uploaded only to products that have none, collections are created once.
// Everything is published to the Headless channel only.
//
//   node scripts/seed.mjs            (requires scripts/schema.mjs to have run)

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { check, gql, ROOT } from './admin.mjs';
import { NOTES } from './catalog/notes.mjs';
import { PRODUCTS } from './catalog/products.mjs';
import { imageAlt, PRODUCT_METAFIELD_TYPES, toMetafieldInput, toProductSetInput } from './catalog/shopify-input.mjs';
import { PRODUCT_TYPES } from './catalog/vocab.mjs';

const IMAGE_DIR = join(ROOT, 'assets', 'products');

const COLLECTIONS = [
  { handle: 'perfumes', title: 'Eaux de Parfum', types: [PRODUCT_TYPES.perfume] },
  { handle: 'discovery-sets', title: 'Discovery Sets', types: [PRODUCT_TYPES.discoverySet] },
  { handle: 'home-fragrance', title: 'Home Fragrance', types: [PRODUCT_TYPES.candle, PRODUCT_TYPES.diffuser] },
  { handle: 'gifts', title: 'Gifts', types: [PRODUCT_TYPES.giftSet, PRODUCT_TYPES.discoverySet] },
];

async function headlessPublicationId() {
  const d = await gql(`{ publications(first: 20) { nodes { id name } } }`);
  const pub = d.publications.nodes.find((p) => /headless/i.test(p.name));
  if (!pub) throw new Error(`No Headless publication. Found: ${d.publications.nodes.map((p) => p.name).join(', ')}`);
  return pub.id;
}

async function primaryLocationId() {
  const d = await gql(`{ locations(first: 5) { nodes { id name isActive } } }`);
  const loc = d.locations.nodes.find((l) => l.isActive);
  if (!loc) throw new Error('No active location');
  return loc.id;
}

async function publish(id, publicationId) {
  const r = await gql(
    `mutation($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`,
    { id, input: [{ publicationId }] },
  );
  check(r.publishablePublish, `publish ${id}`);
}

async function seedNotes() {
  const ids = new Map();
  for (const note of NOTES) {
    const r = await gql(
      `mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject { id }
          userErrors { field message code }
        }
      }`,
      {
        handle: { type: 'fragrance_note', handle: note.handle },
        metaobject: {
          fields: [
            { key: 'name', value: note.name },
            { key: 'description', value: note.description },
            { key: 'group', value: note.group },
          ],
        },
      },
    );
    check(r.metaobjectUpsert, `note ${note.handle}`);
    ids.set(note.handle, r.metaobjectUpsert.metaobject.id);
  }
  console.log(`  ${ids.size} notes upserted`);
  return ids;
}

async function stagedUpload(filePath, filename) {
  const size = statSync(filePath).size;
  const r = await gql(
    `mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    { input: [{ filename, mimeType: 'image/jpeg', resource: 'IMAGE', httpMethod: 'POST', fileSize: String(size) }] },
  );
  check(r.stagedUploadsCreate, `staged upload ${filename}`);
  const target = r.stagedUploadsCreate.stagedTargets[0];

  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  form.append('file', new Blob([readFileSync(filePath)], { type: 'image/jpeg' }), filename);
  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload of ${filename} failed: HTTP ${res.status}`);
  return target.resourceUrl;
}

async function ensureImage(product, productId, mediaCount) {
  if (mediaCount > 0) return 'kept';
  const file = join(IMAGE_DIR, `${product.handle}.jpg`);
  if (!existsSync(file)) return 'missing';
  const source = await stagedUpload(file, `${product.handle}.jpg`);
  const r = await gql(
    `mutation($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { id }
        mediaUserErrors { field message }
      }
    }`,
    { productId, media: [{ originalSource: source, mediaContentType: 'IMAGE', alt: imageAlt(product) }] },
  );
  const errs = r.productCreateMedia.mediaUserErrors;
  if (errs.length) throw new Error(`image ${product.handle}: ${JSON.stringify(errs)}`);
  return 'uploaded';
}

async function seedProducts(noteIds, locationId, publicationId) {
  const ids = new Map();
  for (const product of PRODUCTS) {
    const r = await gql(
      `mutation($identifier: ProductSetIdentifiers!, $input: ProductSetInput!) {
        productSet(identifier: $identifier, input: $input, synchronous: true) {
          product { id mediaCount { count } }
          userErrors { field message code }
        }
      }`,
      { identifier: { handle: product.handle }, input: toProductSetInput(product, { noteIds, locationId }) },
    );
    check(r.productSet, `product ${product.handle}`);
    const { id, mediaCount } = r.productSet.product;
    ids.set(product.handle, id);
    await publish(id, publicationId);
    const image = await ensureImage(product, id, mediaCount.count);
    console.log(`  ${product.handle.padEnd(22)} ${product.productType.padEnd(14)} image ${image}`);
  }
  return ids;
}

async function seedIncludes(productIds) {
  const metafields = PRODUCTS.filter((p) => p.metafields.includes).map((p) => ({
    ownerId: productIds.get(p.handle),
    ...toMetafieldInput('includes', p.metafields.includes, PRODUCT_METAFIELD_TYPES, { productIds }),
  }));
  const r = await gql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message code } }
    }`,
    { metafields },
  );
  check(r.metafieldsSet, 'includes');
  console.log(`  includes set on ${metafields.length} products`);
}

async function seedCollections(publicationId) {
  for (const c of COLLECTIONS) {
    const found = await gql(`query($h: String!) { collectionByHandle(handle: $h) { id } }`, { h: c.handle });
    let id = found.collectionByHandle?.id;
    if (!id) {
      const r = await gql(
        `mutation($input: CollectionInput!) {
          collectionCreate(input: $input) { collection { id } userErrors { field message } }
        }`,
        {
          input: {
            handle: c.handle,
            title: c.title,
            ruleSet: {
              appliedDisjunctively: true,
              rules: c.types.map((t) => ({ column: 'TYPE', relation: 'EQUALS', condition: t })),
            },
          },
        },
      );
      check(r.collectionCreate, `collection ${c.handle}`);
      id = r.collectionCreate.collection.id;
    }
    await publish(id, publicationId);
    console.log(`  collection ${c.handle.padEnd(16)} type = ${c.types.join(' | ')}`);
  }
}

const publicationId = await headlessPublicationId();
const locationId = await primaryLocationId();
console.log('notes');
const noteIds = await seedNotes();
console.log('products');
const productIds = await seedProducts(noteIds, locationId, publicationId);
console.log('set contents');
await seedIncludes(productIds);
console.log('collections');
await seedCollections(publicationId);
console.log('done');
