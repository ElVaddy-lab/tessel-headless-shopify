import { describe, expect, it } from 'vitest';
import { NOTES } from './notes.mjs';
import { DISCOVERY_SETS, GIFT_SETS, HOME, PERFUMES, PRODUCTS } from './products.mjs';
import {
  CONCENTRATIONS,
  FAMILIES,
  LONGEVITY,
  NOTE_GROUPS,
  OCCASIONS,
  PRODUCT_TYPES,
  SEASONS,
  SILLAGE,
} from './vocab.mjs';

const noteHandles = new Set(NOTES.map((n) => n.handle));
const productHandles = new Set(PRODUCTS.map((p) => p.handle));
const NOTE_FIELDS = ['top_notes', 'heart_notes', 'base_notes', 'notes'];

describe('notes', () => {
  it('have unique handles and valid groups', () => {
    expect(noteHandles.size).toBe(NOTES.length);
    for (const note of NOTES) {
      expect(NOTE_GROUPS, note.handle).toContain(note.group);
      expect(note.handle).toMatch(/^[a-z0-9-]+$/);
      expect(note.description.length, note.handle).toBeGreaterThan(5);
    }
  });

  it('are all used by at least one product', () => {
    const used = new Set(PRODUCTS.flatMap((p) => p.metafields.notes ?? []));
    expect([...noteHandles].filter((h) => !used.has(h))).toEqual([]);
  });
});

describe('products', () => {
  it('match the agreed assortment: 18 products', () => {
    expect(PERFUMES).toHaveLength(10);
    expect(DISCOVERY_SETS).toHaveLength(2);
    expect(HOME.filter((p) => p.productType === PRODUCT_TYPES.candle)).toHaveLength(3);
    expect(HOME.filter((p) => p.productType === PRODUCT_TYPES.diffuser)).toHaveLength(2);
    expect(GIFT_SETS).toHaveLength(1);
    expect(PRODUCTS).toHaveLength(18);
  });

  it('have unique handles and SKUs', () => {
    expect(productHandles.size).toBe(PRODUCTS.length);
    const skus = PRODUCTS.flatMap((p) => p.variants.map((v) => v.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('use only known product types and positive prices', () => {
    for (const p of PRODUCTS) {
      expect(Object.values(PRODUCT_TYPES), p.handle).toContain(p.productType);
      for (const v of p.variants) expect(Number(v.price), v.sku).toBeGreaterThan(0);
      if (p.variants.length > 1) expect(p.option, p.handle).toBeTruthy();
    }
  });

  it('reference only existing notes', () => {
    for (const p of PRODUCTS) {
      for (const field of NOTE_FIELDS) {
        for (const handle of p.metafields[field] ?? []) {
          expect(noteHandles.has(handle), `${p.handle}.${field}: ${handle}`).toBe(true);
        }
      }
    }
  });

  it('reference only existing products in includes and scentOf', () => {
    for (const p of PRODUCTS) {
      for (const handle of p.metafields.includes ?? []) expect(productHandles.has(handle), `${p.handle} → ${handle}`).toBe(true);
      if (p.scentOf) expect(productHandles.has(p.scentOf), p.handle).toBe(true);
    }
  });
});

describe('perfumes', () => {
  it('have a full, valid fragrance profile', () => {
    for (const p of PERFUMES) {
      const m = p.metafields;
      expect(FAMILIES, p.handle).toContain(m.family);
      expect(m.top_notes.length && m.heart_notes.length && m.base_notes.length, p.handle).toBeTruthy();
      expect(m.notes).toEqual([...m.top_notes, ...m.heart_notes, ...m.base_notes]);
      expect(new Set(m.notes).size, `${p.handle} repeats a note`).toBe(m.notes.length);
      expect([1, 2, 3]).toContain(m.intensity);
      for (const s of m.seasons) expect(SEASONS).toContain(s);
      for (const o of m.occasions) expect(OCCASIONS).toContain(o);
      expect(LONGEVITY).toContain(m.longevity);
      expect(SILLAGE).toContain(m.sillage);
      expect(CONCENTRATIONS).toContain(m.concentration);
    }
  });

  it('cover 7 families so the finder has real choices', () => {
    expect(new Set(PERFUMES.map((p) => p.metafields.family))).toEqual(new Set(FAMILIES));
  });

  it('are split between the two discovery sets exactly once', () => {
    const inSets = DISCOVERY_SETS.flatMap((s) => s.metafields.includes);
    expect(inSets.sort()).toEqual(PERFUMES.map((p) => p.handle).sort());
  });
});
