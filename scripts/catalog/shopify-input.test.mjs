import { describe, expect, it } from 'vitest';
import { NOTES } from './notes.mjs';
import { PRODUCTS } from './products.mjs';
import { PRODUCT_METAFIELD_TYPES, toMetafieldInput, toProductSetInput } from './shopify-input.mjs';

const noteIds = new Map(NOTES.map((n, i) => [n.handle, `gid://shopify/Metaobject/${i + 1}`]));
const ctx = { noteIds, locationId: 'gid://shopify/Location/1' };
const byHandle = (h) => PRODUCTS.find((p) => p.handle === h);

describe('toProductSetInput', () => {
  it('maps a perfume with three sizes, stock and note references', () => {
    const input = toProductSetInput(byHandle('quoin'), ctx);

    expect(input.handle).toBe('quoin');
    expect(input.productType).toBe('Eau de Parfum');
    expect(input.productOptions).toEqual([
      { name: 'Size', values: [{ name: '10 ml' }, { name: '50 ml' }, { name: '100 ml' }] },
    ]);
    expect(input.variants.map((v) => [v.optionValues[0].name, v.price, v.inventoryQuantities[0].quantity])).toEqual([
      ['10 ml', '38.00', 24],
      ['50 ml', '135.00', 24],
      ['100 ml', '195.00', 0],
    ]);

    const top = input.metafields.find((m) => m.key === 'top_notes');
    expect(top.type).toBe('list.metaobject_reference');
    expect(JSON.parse(top.value)).toEqual([noteIds.get('saffron'), noteIds.get('cinnamon')]);

    const intensity = input.metafields.find((m) => m.key === 'intensity');
    expect(intensity).toMatchObject({ type: 'number_integer', value: '3' });

    const seasons = input.metafields.find((m) => m.key === 'seasons');
    expect(JSON.parse(seasons.value)).toEqual(['Autumn', 'Winter']);
  });

  it('uses the default option for single-variant products and skips includes', () => {
    const input = toProductSetInput(byHandle('discovery-set-light'), ctx);
    expect(input.productOptions).toEqual([{ name: 'Title', values: [{ name: 'Default Title' }] }]);
    expect(input.variants[0].optionValues).toEqual([{ optionName: 'Title', name: 'Default Title' }]);
    expect(input.metafields.find((m) => m.key === 'includes')).toBeUndefined();
  });

  it('puts burn time on candle variants', () => {
    const input = toProductSetInput(byHandle('architrave-candle'), ctx);
    expect(input.variants.map((v) => v.metafields[0])).toEqual([
      { namespace: 'custom', key: 'burn_time_hours', type: 'number_integer', value: '40' },
      { namespace: 'custom', key: 'burn_time_hours', type: 'number_integer', value: '90' },
    ]);
  });

  it('only uses metafield keys that exist in the schema', () => {
    for (const p of PRODUCTS) {
      for (const key of Object.keys(p.metafields)) expect(PRODUCT_METAFIELD_TYPES, `${p.handle}.${key}`).toHaveProperty(key);
    }
  });

  it('escapes HTML in descriptions', () => {
    const input = toProductSetInput({ ...byHandle('plinth'), description: 'A < B & C' }, ctx);
    expect(input.descriptionHtml).toBe('<p>A &lt; B &amp; C</p>');
  });
});

describe('toMetafieldInput', () => {
  it('fails loudly on unknown references', () => {
    expect(() => toMetafieldInput('notes', ['nope'], PRODUCT_METAFIELD_TYPES, { noteIds })).toThrow(/nope/);
    expect(() => toMetafieldInput('includes', ['nope'], PRODUCT_METAFIELD_TYPES, { productIds: new Map() })).toThrow(/nope/);
  });
});
