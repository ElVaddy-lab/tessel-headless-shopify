// Data model: the fragrance_note metaobject and product / variant metafield definitions.
// Idempotent: creates only what is missing. Everything is readable by the Storefront API.
//
//   node scripts/schema.mjs

import { check, gql } from './admin.mjs';

import {
  CONCENTRATIONS,
  FAMILIES,
  LONGEVITY,
  NOTE_GROUPS,
  OCCASIONS,
  SEASONS,
  SILLAGE,
} from './catalog/vocab.mjs';

const NAMESPACE = 'custom';

const choices = (values) => ({ name: 'choices', value: JSON.stringify(values) });
const range = (min, max) => [
  { name: 'min', value: String(min) },
  { name: 'max', value: String(max) },
];

const NOTE_DEFINITION = {
  type: 'fragrance_note',
  name: 'Fragrance note',
  description: 'A single scent note (bergamot, vetiver…). Linked from products; tiles in the fragrance finder.',
  displayNameKey: 'name',
  access: { storefront: 'PUBLIC_READ' },
  fieldDefinitions: [
    { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
    {
      key: 'description',
      name: 'Description',
      type: 'multi_line_text_field',
      description: 'One short line on how the note smells.',
    },
    {
      key: 'group',
      name: 'Group',
      type: 'single_line_text_field',
      required: true,
      description: 'Scent group; drives tile colour and grouping in the finder.',
      validations: [choices(NOTE_GROUPS)],
    },
  ],
};

// `noteRef` is replaced with the real metaobject definition id at run time.
const noteRef = Symbol('noteRef');

const PRODUCT_FIELDS = [
  // Fragrance profile (eau de parfum)
  { key: 'family', name: 'Fragrance family', type: 'single_line_text_field', validations: [choices(FAMILIES)] },
  { key: 'top_notes', name: 'Top notes', type: 'list.metaobject_reference', validations: noteRef },
  { key: 'heart_notes', name: 'Heart notes', type: 'list.metaobject_reference', validations: noteRef },
  { key: 'base_notes', name: 'Base notes', type: 'list.metaobject_reference', validations: noteRef },
  {
    key: 'notes',
    name: 'All notes',
    type: 'list.metaobject_reference',
    validations: noteRef,
    description: 'Every note of the product: union of top/heart/base for perfumes, key notes for candles and diffusers. Used by catalog filters and the finder; filled by the seed script.',
  },
  {
    key: 'intensity',
    name: 'Intensity',
    type: 'number_integer',
    description: '1 light, 2 moderate, 3 intense.',
    validations: range(1, 3),
  },
  { key: 'seasons', name: 'Seasons', type: 'list.single_line_text_field', validations: [choices(SEASONS)] },
  { key: 'occasions', name: 'Occasions', type: 'list.single_line_text_field', validations: [choices(OCCASIONS)] },
  { key: 'longevity', name: 'Longevity', type: 'single_line_text_field', validations: [choices(LONGEVITY)] },
  { key: 'sillage', name: 'Sillage', type: 'single_line_text_field', validations: [choices(SILLAGE)] },
  {
    key: 'concentration',
    name: 'Concentration',
    type: 'single_line_text_field',
    validations: [choices(CONCENTRATIONS)],
  },
  // Sets
  {
    key: 'includes',
    name: 'Includes',
    type: 'list.product_reference',
    description: 'Products inside a discovery set or gift set.',
  },
  { key: 'packaging', name: 'Packaging', type: 'multi_line_text_field', description: 'Gift set packaging.' },
  // Home fragrance
  {
    key: 'materials',
    name: 'Materials',
    type: 'multi_line_text_field',
    description: 'Composition of a candle or diffuser (wax, wick, base oil…).',
  },
  { key: 'how_to_use', name: 'How to use', type: 'multi_line_text_field' },
  {
    key: 'duration_weeks',
    name: 'Lasts (weeks)',
    type: 'number_integer',
    description: 'Approximate life of a diffuser.',
    validations: range(1, 52),
  },
];

const VARIANT_FIELDS = [
  {
    key: 'burn_time_hours',
    name: 'Burn time (hours)',
    type: 'number_integer',
    description: 'Candle burn time for this size.',
    validations: range(1, 500),
  },
];

async function ensureNoteDefinition() {
  const found = await gql(`query { metaobjectDefinitionByType(type: "fragrance_note") { id fieldDefinitions { key } } }`);
  const existing = found.metaobjectDefinitionByType;
  if (existing) {
    const have = new Set(existing.fieldDefinitions.map((f) => f.key));
    const missing = NOTE_DEFINITION.fieldDefinitions.filter((f) => !have.has(f.key));
    if (missing.length) {
      const r = await gql(
        `mutation($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) { userErrors { field message code } }
        }`,
        { id: existing.id, definition: { fieldDefinitions: missing.map((f) => ({ create: f })) } },
      );
      check(r.metaobjectDefinitionUpdate, 'fragrance_note update');
      console.log(`  metaobject fragrance_note: added ${missing.map((f) => f.key).join(', ')}`);
    } else {
      console.log('  metaobject fragrance_note exists');
    }
    return existing.id;
  }

  const r = await gql(
    `mutation($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id }
        userErrors { field message code }
      }
    }`,
    { definition: NOTE_DEFINITION },
  );
  check(r.metaobjectDefinitionCreate, 'fragrance_note definition');
  console.log('  metaobject fragrance_note created');
  return r.metaobjectDefinitionCreate.metaobjectDefinition.id;
}

async function ensureMetafields(ownerType, fields, noteDefinitionId) {
  const d = await gql(
    `query($o: MetafieldOwnerType!, $ns: String!) {
      metafieldDefinitions(first: 100, ownerType: $o, namespace: $ns) { nodes { key } }
    }`,
    { o: ownerType, ns: NAMESPACE },
  );
  const have = new Set(d.metafieldDefinitions.nodes.map((n) => n.key));

  for (const field of fields) {
    const label = `${ownerType.toLowerCase()} ${NAMESPACE}.${field.key}`;
    if (have.has(field.key)) {
      console.log(`  ${label} exists`);
      continue;
    }
    const validations =
      field.validations === noteRef
        ? [{ name: 'metaobject_definition_id', value: noteDefinitionId }]
        : field.validations;
    const r = await gql(
      `mutation($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          ...field,
          validations,
          namespace: NAMESPACE,
          ownerType,
          access: { storefront: 'PUBLIC_READ' },
          pin: true,
        },
      },
    );
    check(r.metafieldDefinitionCreate, label);
    console.log(`  ${label} (${field.type})`);
  }
}

console.log('fragrance_note metaobject');
const noteDefinitionId = await ensureNoteDefinition();
console.log('product metafields');
await ensureMetafields('PRODUCT', PRODUCT_FIELDS, noteDefinitionId);
console.log('variant metafields');
await ensureMetafields('PRODUCTVARIANT', VARIANT_FIELDS, noteDefinitionId);
console.log('done');
