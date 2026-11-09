"use client";

import { NOTE_GROUP_BG, type NoteGroup } from "@/lib/notes";

type Props = {
  name: string;
  group: NoteGroup | null;
  state: "like" | "avoid" | null;
  mode: "like" | "avoid";
  onToggle: () => void;
};

/**
 * Interactive note tile. `aria-pressed` reflects the current mode ("I like" / "avoid"),
 * and the tile's full state is also spoken and shown without relying on colour:
 * liked = thick ink frame + ✓, avoided = hatching + × + struck-through name.
 */
export function NoteToggle({ name, group, state, mode, onToggle }: Props) {
  const stateText = state === "like" ? "liked" : state === "avoid" ? "avoided" : null;

  return (
    <button
      type="button"
      aria-pressed={state === mode}
      onClick={onToggle}
      className={`relative flex aspect-square w-full flex-col justify-between overflow-hidden p-2.5 text-left transition-[outline-color] sm:p-3 ${group ? NOTE_GROUP_BG[group] : "bg-paper-2"} ${
        state === "like" ? "outline-[3px] -outline-offset-[3px] outline-ink outline-solid" : "border border-control hover:border-ink"
      }`}
    >
      {state === "avoid" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgb(30_28_25/0.16)_7px_8.5px)]"
        />
      ) : null}
      <span className="relative flex items-start justify-between gap-1">
        <span className="label text-ink">{group}</span>
        {state ? (
          <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center bg-ink text-sm leading-none text-paper">
            {state === "like" ? "✓" : "×"}
          </span>
        ) : null}
      </span>
      <span className={`relative text-sm leading-tight font-medium sm:text-base ${state === "avoid" ? "line-through decoration-2" : ""}`}>
        {name}
        {stateText ? <span className="sr-only">, {stateText}</span> : null}
      </span>
    </button>
  );
}
