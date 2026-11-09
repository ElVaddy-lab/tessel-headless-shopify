// Pure mapping from catalog data to Admin API inputs (unit-tested, no network).

export const VENDOR = 'Tessel';
export const NAMESPACE = 'custom';

// Metafield types, mirroring scripts/schema.mjs.
export const PRODUCT_METAFIELD_TYPES = {
  family: 'single_line_text_field',
  top_notes: 'list.metaobject_reference',
  heart_notes: 'list.metaobject_reference',
  base_notes: 'list.metaobject_reference',
  notes: 'list.metaobject_reference',
  intensity: 'number_integer',
  seasons: 'list.single_line_text_field',
  occasions: 'list.single_line_text_field',
  longevity: 'single_line_text_field',
  sillage: 'single_line_text_field',
  concentration: 'single_line_text_field',
  includes: 'list.product_reference',
  packaging: 'multi_line_text_field',
  materials: 'multi_line_text_field',
  how_to_use: 'multi_line_text_field',
  duration_weeks: 'number_integer',
};

export const VARIANT_METAFIELD_TYPES = {
  burn_time_hours: 'number_integer',
};

const NOTE_LIST_KEYS = new Set(['top_notes', 'heart_notes', 'base_notes', 'notes']);

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toMetafieldInput(key, value, types, { noteIds, productIds } = {}) {
  const type = types[key];
  if (!type) throw new Error(`Unknown metafield key: ${key}`);

  let serialized;
  if (NOTE_LIST_KEYS.has(key)) {
    serialized = JSON.stringify(
      value.map((handle) => {
        const id = noteIds?.get(handle);
        if (!id) throw new Error(`Note "${handle}" has no metaobject id`);
        return id;
      }),
    );
  } else if (type === 'list.product_reference') {
    serialized = JSON.stringify(
      value.map((handle) => {
        const id = productIds?.get(handle);
        if (!id) throw new Error(`Product "${handle}" has no id yet`);
        return id;
      }),
    );
  } else if (type.startsWith('list.')) {
    serialized = JSON.stringify(value);
  } else {
    serialized = String(value);
  }

  return { namespace: NAMESPACE, key, type, value: serialized };
}

/**
 * productSet input for one catalog product. `includes` (product references) is left out:
 * it needs every product id, so the seed script sets it in a second pass.
 */
export function toProductSetInput(product, { noteIds, locationId }) {
  const optionName = product.option ?? 'Title';
  const optionValue = (variant) => variant.option ?? 'Default Title';

  const metafields = Object.entries(product.metafields)
    .filter(([key]) => key !== 'includes')
    .map(([key, value]) => toMetafieldInput(key, value, PRODUCT_METAFIELD_TYPES, { noteIds }));

  return {
    title: product.title,
    handle: product.handle,
    vendor: VENDOR,
    productType: product.productType,
    status: 'ACTIVE',
    descriptionHtml: `<p>${escapeHtml(product.description)}</p>`,
    productOptions: [{ name: optionName, values: product.variants.map((v) => ({ name: optionValue(v) })) }],
    variants: product.variants.map((variant, index) => ({
      position: index + 1,
      optionValues: [{ optionName, name: optionValue(variant) }],
      price: variant.price,
      sku: variant.sku,
      inventoryPolicy: 'DENY',
      inventoryItem: { tracked: true },
      inventoryQuantities: [{ locationId, name: 'available', quantity: variant.stock }],
      metafields: Object.entries(variant.metafields ?? {}).map(([key, value]) =>
        toMetafieldInput(key, value, VARIANT_METAFIELD_TYPES),
      ),
    })),
    metafields,
  };
}

export function imageAlt(product) {
  return `${product.title} by Tessel — ${product.productType.toLowerCase()}`;
}
