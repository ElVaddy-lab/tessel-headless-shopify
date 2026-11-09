export const NOTE_GROUPS = [
  "Citrus",
  "Floral",
  "Woody",
  "Amber",
  "Fresh",
  "Gourmand",
  "Green",
  "Spicy",
  "Musky",
] as const;

export type NoteGroup = (typeof NOTE_GROUPS)[number];

/** Tailwind background class per note group (colours live in globals.css). */
export const NOTE_GROUP_BG: Record<NoteGroup, string> = {
  Citrus: "bg-note-citrus",
  Floral: "bg-note-floral",
  Woody: "bg-note-woody",
  Amber: "bg-note-amber",
  Fresh: "bg-note-fresh",
  Gourmand: "bg-note-gourmand",
  Green: "bg-note-green",
  Spicy: "bg-note-spicy",
  Musky: "bg-note-musky",
};

export function isNoteGroup(value: string | null | undefined): value is NoteGroup {
  return NOTE_GROUPS.includes(value as NoteGroup);
}
