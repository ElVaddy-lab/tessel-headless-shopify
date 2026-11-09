import type { Money } from "@/lib/format";
import { isNoteGroup, type NoteGroup } from "@/lib/notes";
import { PRODUCT_CARD_FRAGMENT, toProductCard, type ProductCard, type ProductCardNode } from "./products";

const NOTE_FRAGMENT = /* GraphQL */ `
  fragment Note on Metaobject {
    handle
    name: field(key: "name") {
      value
    }
    group: field(key: "group") {
      value
    }
    description: field(key: "description") {
      value
    }
  }
`;

const noteList = (alias: string, key: string) => `
    ${alias}: metafield(namespace: "custom", key: "${key}") {
      references(first: 20) {
        nodes {
          ...Note
        }
      }
    }`;

const text = (alias: string, key: string) => `
    ${alias}: metafield(namespace: "custom", key: "${key}") {
      value
    }`;

export const PRODUCT_DETAIL_QUERY = /* GraphQL */ `
  query ProductDetail($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      productType
      description
      descriptionHtml
      availableForSale
      seo {
        title
        description
      }
      featuredImage {
        url
        altText
        width
        height
      }
      variants(first: 10) {
        nodes {
          id
          title
          sku
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          burnTime: metafield(namespace: "custom", key: "burn_time_hours") {
            value
          }
        }
      }
      ${text("family", "family")}
      ${text("intensity", "intensity")}
      ${text("seasons", "seasons")}
      ${text("occasions", "occasions")}
      ${text("longevity", "longevity")}
      ${text("sillage", "sillage")}
      ${text("concentration", "concentration")}
      ${text("packaging", "packaging")}
      ${text("materials", "materials")}
      ${text("howToUse", "how_to_use")}
      ${text("durationWeeks", "duration_weeks")}
      ${noteList("topNotes", "top_notes")}
      ${noteList("heartNotes", "heart_notes")}
      ${noteList("baseNotes", "base_notes")}
      ${noteList("notes", "notes")}
      includes: metafield(namespace: "custom", key: "includes") {
        references(first: 10) {
          nodes {
            ... on Product {
              ...ProductCard
            }
          }
        }
      }
    }
  }
  ${NOTE_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
`;

type Field = { value: string } | null;
type NoteNode = { handle: string; name: Field; group: Field; description: Field };
type NoteListField = { references: { nodes: NoteNode[] } | null } | null;

export type ProductDetailNode = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  seo: { title: string | null; description: string | null };
  featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
  variants: {
    nodes: {
      id: string;
      title: string;
      sku: string | null;
      availableForSale: boolean;
      price: Money;
      selectedOptions: { name: string; value: string }[];
      burnTime: Field;
    }[];
  };
  family: Field;
  intensity: Field;
  seasons: Field;
  occasions: Field;
  longevity: Field;
  sillage: Field;
  concentration: Field;
  packaging: Field;
  materials: Field;
  howToUse: Field;
  durationWeeks: Field;
  topNotes: NoteListField;
  heartNotes: NoteListField;
  baseNotes: NoteListField;
  notes: NoteListField;
  includes: { references: { nodes: ProductCardNode[] } | null } | null;
};

export type Note = { handle: string; name: string; group: NoteGroup | null; description: string | null };

export type Variant = {
  id: string;
  title: string;
  sku: string | null;
  /** Option value shown to the shopper ("50 ml"); null for single-variant products. */
  option: string | null;
  availableForSale: boolean;
  price: Money;
  burnTimeHours: number | null;
};

export type ProductDetail = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  seo: { title: string; description: string };
  image: { url: string; alt: string; width: number; height: number } | null;
  optionName: string | null;
  variants: Variant[];
  family: string | null;
  intensity: 1 | 2 | 3 | null;
  seasons: string[];
  occasions: string[];
  longevity: string | null;
  sillage: string | null;
  concentration: string | null;
  packaging: string[];
  materials: string[];
  howToUse: string[];
  durationWeeks: number | null;
  pyramid: { top: Note[]; heart: Note[]; base: Note[] };
  notes: Note[];
  includes: ProductCard[];
};

const value = (f: Field) => f?.value?.trim() || null;
const lines = (f: Field) => (value(f) ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

function jsonList(f: Field): string[] {
  try {
    const parsed: unknown = JSON.parse(value(f) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function int(f: Field): number | null {
  const n = Number(value(f));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function toNotes(list: NoteListField): Note[] {
  return (list?.references?.nodes ?? []).map((node) => {
    const group = value(node.group);
    return {
      handle: node.handle,
      name: value(node.name) ?? node.handle,
      group: isNoteGroup(group) ? group : null,
      description: value(node.description),
    };
  });
}

export function toProductDetail(node: ProductDetailNode): ProductDetail {
  const variants = node.variants.nodes;
  const realOption = variants[0]?.selectedOptions.find((o) => o.name !== "Title" && o.value !== "Default Title");
  const intensity = int(node.intensity);

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    productType: node.productType,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    availableForSale: node.availableForSale,
    seo: {
      title: node.seo.title || node.title,
      description: node.seo.description || node.description.slice(0, 160),
    },
    image: node.featuredImage
      ? {
          url: node.featuredImage.url,
          alt: node.featuredImage.altText || node.title,
          width: node.featuredImage.width,
          height: node.featuredImage.height,
        }
      : null,
    optionName: realOption?.name ?? null,
    variants: variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      option: realOption ? (v.selectedOptions.find((o) => o.name === realOption.name)?.value ?? v.title) : null,
      availableForSale: v.availableForSale,
      price: v.price,
      burnTimeHours: int(v.burnTime),
    })),
    family: value(node.family),
    intensity: intensity === 1 || intensity === 2 || intensity === 3 ? intensity : null,
    seasons: jsonList(node.seasons),
    occasions: jsonList(node.occasions),
    longevity: value(node.longevity),
    sillage: value(node.sillage),
    concentration: value(node.concentration),
    packaging: lines(node.packaging),
    materials: lines(node.materials),
    howToUse: lines(node.howToUse),
    durationWeeks: int(node.durationWeeks),
    pyramid: { top: toNotes(node.topNotes), heart: toNotes(node.heartNotes), base: toNotes(node.baseNotes) },
    notes: toNotes(node.notes),
    includes: (node.includes?.references?.nodes ?? []).map(toProductCard),
  };
}
