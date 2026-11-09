import { NOTE_GROUP_BG, type NoteGroup } from "@/lib/notes";

type Props = {
  name: string;
  group: NoteGroup | null;
  description?: string | null;
  size?: "sm" | "md";
};

/** Static note tile (product page). The interactive finder tile builds on the same look. */
export function NoteTile({ name, group, description, size = "md" }: Props) {
  return (
    <div
      className={`flex h-full flex-col justify-between gap-3 border border-control ${group ? NOTE_GROUP_BG[group] : "bg-paper-2"} ${size === "sm" ? "p-2.5" : "p-3"}`}
    >
      {group ? <span className="label text-ink">{group}</span> : <span aria-hidden="true" />}
      <span>
        <span className={`block leading-tight font-medium ${size === "sm" ? "text-sm" : "text-base"}`}>{name}</span>
        {description ? <span className="mt-1 block text-xs leading-snug text-ink">{description}</span> : null}
      </span>
    </div>
  );
}
