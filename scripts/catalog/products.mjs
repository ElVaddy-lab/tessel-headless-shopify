// The Tessel catalog: 18 products. Brand and products are fictional (demo store).
// Perfume names are architectural terms; each was checked against existing fragrances
// (Fragrantica / Parfumo / web) on 2026-11-09 — see PLAN.md.
//
// Notes are referenced by handle (notes.mjs); `includes` by product handle.

import { PRODUCT_TYPES } from './vocab.mjs';

const PERFUME_SIZES = [
  { option: '10 ml', price: '38.00', sku: '10' },
  { option: '50 ml', price: '135.00', sku: '50' },
  { option: '100 ml', price: '195.00', sku: '100' },
];

const CANDLE_SIZES = [
  { option: '180 g', price: '52.00', sku: '180', burnTimeHours: 40 },
  { option: '450 g', price: '98.00', sku: '450', burnTimeHours: 90 },
];

const DEFAULT_STOCK = 24;

function perfume({ handle, code, title, family, notes, intensity, seasons, occasions, longevity, sillage, description, soldOut = [] }) {
  return {
    handle,
    title,
    productType: PRODUCT_TYPES.perfume,
    description,
    option: 'Size',
    variants: PERFUME_SIZES.map((s) => ({
      option: s.option,
      price: s.price,
      sku: `TSL-${code}-${s.sku}`,
      stock: soldOut.includes(s.option) ? 0 : DEFAULT_STOCK,
    })),
    metafields: {
      family,
      top_notes: notes.top,
      heart_notes: notes.heart,
      base_notes: notes.base,
      notes: [...notes.top, ...notes.heart, ...notes.base],
      intensity,
      seasons,
      occasions,
      longevity,
      sillage,
      concentration: 'Eau de parfum',
    },
  };
}

function candle({ handle, code, scentOf, title, notes, description }) {
  return {
    handle,
    title,
    productType: PRODUCT_TYPES.candle,
    description,
    option: 'Size',
    variants: CANDLE_SIZES.map((s) => ({
      option: s.option,
      price: s.price,
      sku: `TSL-${code}-${s.sku}`,
      stock: DEFAULT_STOCK,
      metafields: { burn_time_hours: s.burnTimeHours },
    })),
    scentOf,
    metafields: {
      notes,
      materials:
        'Coconut and rapeseed wax blend\nCotton wick\nFragrance oil, 8%\nReusable stoneware vessel with oak lid',
      how_to_use:
        'On the first light, let the wax melt to the edge of the vessel (about 2 hours).\nTrim the wick to 5 mm before each use.\nDo not burn for more than 4 hours at a time.\nNever leave a burning candle unattended.',
    },
  };
}

function diffuser({ handle, code, scentOf, title, notes, description }) {
  return {
    handle,
    title,
    productType: PRODUCT_TYPES.diffuser,
    description,
    variants: [{ price: '68.00', sku: `TSL-${code}-200`, stock: DEFAULT_STOCK }],
    scentOf,
    metafields: {
      notes,
      duration_weeks: 12,
      materials: '200 ml fragrance in a plant-based solvent\n8 natural rattan reeds\nFrosted glass bottle',
      how_to_use:
        'Remove the stopper and place the reeds in the bottle.\nFlip the reeds once a week to refresh the scent.\nUse fewer reeds in small rooms.\nKeep away from direct sunlight and heat.',
    },
  };
}

export const PERFUMES = [
  perfume({
    handle: 'clerestory',
    code: 'CLR',
    title: 'Clerestory',
    family: 'Citrus',
    notes: { top: ['bergamot', 'yuzu', 'pink-pepper'], heart: ['neroli', 'green-tea'], base: ['white-musk', 'cedarwood'] },
    intensity: 1,
    seasons: ['Spring', 'Summer'],
    occasions: ['Everyday', 'Work'],
    longevity: 'Moderate',
    sillage: 'Intimate',
    description:
      'Named after the row of high windows that lets morning light into a hall. Bergamot and yuzu open bright and clean, neroli and green tea keep it airy, and a quiet base of white musk and cedar stays close to the skin.',
  }),
  perfume({
    handle: 'transom',
    code: 'TRN',
    title: 'Transom',
    family: 'Fresh',
    notes: { top: ['sea-salt', 'grapefruit', 'mint'], heart: ['juniper', 'cypress'], base: ['ambrette', 'vetiver'] },
    intensity: 1,
    seasons: ['Spring', 'Summer'],
    occasions: ['Everyday', 'Weekend'],
    longevity: 'Moderate',
    sillage: 'Moderate',
    description:
      'The small window above a door, left open for a draught of sea air. Sea salt, grapefruit and mint feel cool and mineral; juniper and cypress add a green, resinous breeze over soft ambrette and vetiver.',
  }),
  perfume({
    handle: 'mullion',
    code: 'MUL',
    title: 'Mullion',
    family: 'Green',
    notes: { top: ['galbanum', 'lemon'], heart: ['fig-leaf', 'tomato-leaf', 'basil'], base: ['vetiver', 'white-musk'] },
    intensity: 2,
    seasons: ['Spring', 'Summer'],
    occasions: ['Everyday', 'Weekend'],
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description:
      'A garden seen through a divided window. Sharp galbanum and lemon, then the milky green of fig leaf, crushed tomato leaf and basil, grounded by earthy vetiver.',
  }),
  perfume({
    handle: 'pilaster',
    code: 'PIL',
    title: 'Pilaster',
    family: 'Floral',
    notes: { top: ['bergamot', 'violet'], heart: ['iris', 'rose'], base: ['ambrette', 'suede', 'sandalwood'] },
    intensity: 2,
    seasons: ['Autumn', 'Winter', 'Spring'],
    occasions: ['Work', 'Evening'],
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description:
      'A flat column set into a wall: structure without weight. Powdery iris and a soft rose sit on violet and bergamot, then dry down to suede, ambrette and creamy sandalwood.',
  }),
  perfume({
    handle: 'spandrel',
    code: 'SPN',
    title: 'Spandrel',
    family: 'Floral',
    notes: { top: ['bitter-orange', 'mandarin'], heart: ['orange-blossom', 'jasmine', 'magnolia'], base: ['honey', 'white-musk'] },
    intensity: 2,
    seasons: ['Spring', 'Summer'],
    occasions: ['Everyday', 'Evening'],
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description:
      'The sunlit space between two arches. Bitter orange and mandarin give way to a warm bouquet of orange blossom, jasmine and magnolia, finished with a thread of honey and clean musk.',
  }),
  perfume({
    handle: 'plinth',
    code: 'PLN',
    title: 'Plinth',
    family: 'Woody',
    notes: { top: ['black-pepper', 'grapefruit'], heart: ['cedarwood', 'cypress'], base: ['vetiver', 'guaiac-wood'] },
    intensity: 2,
    seasons: ['Autumn', 'Winter', 'Spring'],
    occasions: ['Work', 'Everyday'],
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description:
      'The solid base everything stands on. Black pepper and grapefruit crack open a block of dry cedar and cypress, settling into smoky vetiver and guaiac wood.',
  }),
  perfume({
    handle: 'lintel',
    code: 'LNT',
    title: 'Lintel',
    family: 'Woody',
    notes: { top: ['cardamom', 'bergamot'], heart: ['hinoki', 'violet'], base: ['sandalwood', 'tonka-bean', 'white-musk'] },
    intensity: 2,
    seasons: ['Autumn', 'Winter'],
    occasions: ['Everyday', 'Evening'],
    longevity: 'Long-lasting',
    sillage: 'Intimate',
    description:
      'The beam above a doorway, worn smooth by hands. Cool cardamom and bergamot, the clean wood of hinoki with a touch of violet, and a soft, skin-close base of sandalwood and tonka.',
  }),
  perfume({
    handle: 'architrave',
    code: 'ARC',
    title: 'Architrave',
    family: 'Amber',
    notes: { top: ['olibanum', 'pink-pepper'], heart: ['myrrh', 'labdanum'], base: ['benzoin', 'amber', 'cedarwood'] },
    intensity: 3,
    seasons: ['Autumn', 'Winter'],
    occasions: ['Evening'],
    longevity: 'Very long-lasting',
    sillage: 'Strong',
    description:
      'Carved stone above a church door, still holding the smoke. Frankincense and pink pepper, then dark myrrh and labdanum, warming into benzoin and amber on a dry cedar frame.',
  }),
  perfume({
    handle: 'quoin',
    code: 'QUO',
    title: 'Quoin',
    family: 'Amber',
    notes: { top: ['saffron', 'cinnamon'], heart: ['rose', 'labdanum'], base: ['amber', 'tonka-bean', 'vanilla'] },
    intensity: 3,
    seasons: ['Autumn', 'Winter'],
    occasions: ['Evening', 'Weekend'],
    longevity: 'Very long-lasting',
    sillage: 'Strong',
    description:
      'The cornerstone that locks two walls together. Saffron and cinnamon glow over a deep rose and labdanum heart, wrapped in amber, tonka and vanilla.',
    soldOut: ['100 ml'],
  }),
  perfume({
    handle: 'cornice',
    code: 'COR',
    title: 'Cornice',
    family: 'Gourmand',
    notes: { top: ['pear', 'cardamom'], heart: ['almond', 'cocoa'], base: ['tonka-bean', 'vanilla', 'sandalwood'] },
    intensity: 2,
    seasons: ['Autumn', 'Winter'],
    occasions: ['Weekend', 'Evening'],
    longevity: 'Long-lasting',
    sillage: 'Moderate',
    description:
      'A moulding along the top of a wall — and a variety of pear. Ripe pear and cardamom over almond and dry cocoa, finished with tonka, vanilla and sandalwood. Sweet, but never sticky.',
  }),
];

const LIGHT = ['clerestory', 'transom', 'mullion', 'spandrel', 'pilaster'];
const DEEP = ['plinth', 'lintel', 'architrave', 'quoin', 'cornice'];

export const DISCOVERY_SETS = [
  {
    handle: 'discovery-set-light',
    title: 'Discovery Set: Light',
    productType: PRODUCT_TYPES.discoverySet,
    description:
      'Five 2 ml sprays of the brighter half of the collection: citrus, fresh, green and floral. A way to wear each one for a few days before choosing a full bottle.',
    variants: [{ price: '34.00', sku: 'TSL-DSL-5X2', stock: DEFAULT_STOCK }],
    metafields: { includes: LIGHT },
  },
  {
    handle: 'discovery-set-deep',
    title: 'Discovery Set: Deep',
    productType: PRODUCT_TYPES.discoverySet,
    description:
      'Five 2 ml sprays of the darker half of the collection: woods, resins and gourmand. A way to wear each one for a few days before choosing a full bottle.',
    variants: [{ price: '34.00', sku: 'TSL-DSD-5X2', stock: DEFAULT_STOCK }],
    metafields: { includes: DEEP },
  },
];

export const HOME = [
  candle({
    handle: 'architrave-candle',
    code: 'ARC-C',
    scentOf: 'architrave',
    title: 'Architrave Candle',
    notes: ['olibanum', 'myrrh', 'amber'],
    description: 'The smoky, resinous scent of Architrave for the room: frankincense, myrrh and warm amber.',
  }),
  candle({
    handle: 'mullion-candle',
    code: 'MUL-C',
    scentOf: 'mullion',
    title: 'Mullion Candle',
    notes: ['fig-leaf', 'tomato-leaf', 'vetiver'],
    description: 'Mullion’s greenhouse green for the room: fig leaf, tomato leaf and earthy vetiver.',
  }),
  candle({
    handle: 'cornice-candle',
    code: 'COR-C',
    scentOf: 'cornice',
    title: 'Cornice Candle',
    notes: ['pear', 'tonka-bean', 'vanilla'],
    description: 'Cornice’s soft gourmand warmth for the room: ripe pear, tonka and vanilla.',
  }),
  diffuser({
    handle: 'clerestory-diffuser',
    code: 'CLR-D',
    scentOf: 'clerestory',
    title: 'Clerestory Diffuser',
    notes: ['bergamot', 'neroli', 'white-musk'],
    description: 'Clerestory’s morning light, made to fill a hallway: bergamot, neroli and clean musk.',
  }),
  diffuser({
    handle: 'plinth-diffuser',
    code: 'PLN-D',
    scentOf: 'plinth',
    title: 'Plinth Diffuser',
    notes: ['cedarwood', 'cypress', 'vetiver'],
    description: 'Plinth’s dry woods for a study or living room: cedar, cypress and vetiver.',
  }),
];

export const GIFT_SETS = [
  {
    handle: 'evening-gift-box',
    title: 'The Evening Box',
    productType: PRODUCT_TYPES.giftSet,
    description:
      'Quoin eau de parfum in 50 ml and the Architrave Candle in 180 g: two warm, resinous scents for long evenings, packed together.',
    variants: [{ price: '175.00', sku: 'TSL-GIFT-EVE', stock: DEFAULT_STOCK }],
    metafields: {
      includes: ['quoin', 'architrave-candle'],
      packaging:
        'Rigid stone-grey box with a recycled-paper insert\nPlain card for a handwritten message\nNo plastic wrap',
    },
  },
];

export const PRODUCTS = [...PERFUMES, ...DISCOVERY_SETS, ...HOME, ...GIFT_SETS];
