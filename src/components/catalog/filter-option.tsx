import type { FilterGroupView } from "@/lib/catalog-params";

type Option = FilterGroupView["options"][number];

/** One checkbox row. Shared by the server-rendered groups and the searchable notes list. */
export function FilterOption({
  param,
  option,
  label = option.label,
  hidden,
}: {
  param: string;
  option: Option;
  label?: string;
  hidden?: boolean;
}) {
  const id = `f-${param}-${option.value}`;
  return (
    <li hidden={hidden}>
      <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          name={param}
          value={option.value}
          defaultChecked={option.checked}
          className="size-4 shrink-0 accent-ink"
        />
        <span>
          {label} <span className="text-muted">({option.count})</span>
        </span>
      </label>
    </li>
  );
}
