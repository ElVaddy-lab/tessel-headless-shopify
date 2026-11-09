"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { IntensityScale } from "@/components/intensity-scale";
import {
  answersFromParams,
  answersToQuery,
  EMPTY_ANSWERS,
  FAMILIES,
  hasAnswers,
  INTENSITY_LABELS,
  OCCASIONS,
  rankScents,
  suggestSet,
  toggleNote,
  type FinderAnswers,
  type Intensity,
} from "@/lib/finder";
import { formatPrice, type Money } from "@/lib/format";
import { NOTE_GROUP_BG, NOTE_GROUPS, type NoteGroup } from "@/lib/notes";
import type { PerfumeProfile, ProfileNote } from "@/lib/shopify/catalog";
import { NoteToggle } from "./note-toggle";

export type FinderSet = {
  handle: string;
  title: string;
  price: Money;
  image: { url: string; alt: string } | null;
  includes: string[];
};

type Props = { perfumes: PerfumeProfile[]; sets: FinderSet[] };

const FAMILY_HINTS: Record<(typeof FAMILIES)[number], string> = {
  Citrus: "Bright peel and zest",
  Floral: "Petals, soft or rich",
  Woody: "Dry woods and roots",
  Amber: "Warm resins and spice",
  Fresh: "Sea air, cool herbs",
  Gourmand: "Pear, vanilla, cocoa",
  Green: "Leaves and stems",
};

const OCCASION_HINTS: Record<(typeof OCCASIONS)[number], string> = {
  Everyday: "Easy to wear, any day",
  Work: "Close to the skin, polite",
  Evening: "Deeper, made to be noticed",
  Weekend: "Relaxed and personal",
};

const STEPS = ["Occasion", "Families", "Intensity", "Notes"] as const;

export function Finder({ perfumes, sets }: Props) {
  const searchParams = useSearchParams();
  const notes = useMemo(() => uniqueNotes(perfumes), [perfumes]);
  const known = useMemo(() => ({ notes: new Set(notes.map((n) => n.handle)) }), [notes]);

  const [answers, setAnswers] = useState<FinderAnswers>(() => answersFromParams(searchParams, known));
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"like" | "avoid">("like");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Keep the URL in sync so results can be shared; no navigation, no refetch.
  useEffect(() => {
    const query = answersToQuery(answers);
    window.history.replaceState(null, "", query ? `/finder?${query}` : "/finder");
  }, [answers]);

  // Move focus to the new step's heading (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step]);

  const matches = useMemo(() => rankScents(perfumes, answers, 3), [perfumes, answers]);
  const set = useMemo(() => suggestSet(sets, matches.map((m) => m.product.handle)), [sets, matches]);
  const answered = hasAnswers(answers);

  const update = (patch: Partial<FinderAnswers>) => setAnswers((a) => ({ ...a, ...patch }));
  const goTo = (next: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, next)));

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <section aria-labelledby="finder-step-title" className="lg:col-span-7">
        <ol className="grid grid-cols-4 border-t border-l border-line" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className="border-r border-b border-line">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === step ? "step" : undefined}
                className={`flex min-h-12 w-full flex-col items-start justify-center px-3 py-2 text-left ${i === step ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
              >
                <span className={`label ${i === step ? "text-paper" : "text-muted"}`}>0{i + 1}</span>
                <span className="text-sm">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          {step === 0 ? (
            <Step id="finder-step-title" headingRef={stepHeading} title="What is it for?" hint="Pick one, or skip.">
              <ChoiceGrid
                name="occasion"
                type="radio"
                options={[...OCCASIONS.map((o) => ({ value: o, label: o, hint: OCCASION_HINTS[o] })), { value: "", label: "No preference", hint: "Show everything" }]}
                isChecked={(v) => (answers.occasion ?? "") === v}
                onChange={(v) => update({ occasion: v || null })}
              />
            </Step>
          ) : null}

          {step === 1 ? (
            <Step id="finder-step-title" headingRef={stepHeading} title="Which families draw you?" hint="Choose as many as you like.">
              <ChoiceGrid
                name="family"
                type="checkbox"
                options={FAMILIES.map((f) => ({ value: f, label: f, hint: FAMILY_HINTS[f], swatch: f as NoteGroup }))}
                isChecked={(v) => answers.families.includes(v)}
                onChange={(v, checked) =>
                  update({ families: checked ? [...answers.families, v] : answers.families.filter((f) => f !== v) })
                }
              />
            </Step>
          ) : null}

          {step === 2 ? (
            <Step id="finder-step-title" headingRef={stepHeading} title="How strong should it be?" hint="From close to the skin to filling the room.">
              <ChoiceGrid
                name="intensity"
                type="radio"
                options={[
                  ...([1, 2, 3] as Intensity[]).map((i) => ({
                    value: String(i),
                    label: INTENSITY_LABELS[i],
                    hint: ["Stays close, quiet", "Noticeable, balanced", "Rich, long-lasting"][i - 1],
                    scale: i,
                  })),
                  { value: "", label: "No preference", hint: "Any strength" },
                ]}
                isChecked={(v) => String(answers.intensity ?? "") === v}
                onChange={(v) => update({ intensity: v ? (Number(v) as Intensity) : null })}
              />
            </Step>
          ) : null}

          {step === 3 ? (
            <Step
              id="finder-step-title"
              headingRef={stepHeading}
              title="Pick the notes"
              hint="Press a tile to mark it. Press again to clear. Matches update as you go."
            >
              <fieldset className="mb-5">
                <legend className="sr-only">What pressing a note does</legend>
                <div className="inline-grid grid-cols-2 border border-ink">
                  {(["like", "avoid"] as const).map((m) => (
                    <label
                      key={m}
                      className={`flex min-h-11 cursor-pointer items-center px-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-ink ${mode === m ? "bg-ink text-paper has-[:focus-visible]:outline-paper" : ""}`}
                    >
                      <input type="radio" name="note-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                      {m === "like" ? "✓ Notes I like" : "× Notes to avoid"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5" aria-label="Notes">
                {notes.map((note) => (
                  <li key={note.handle}>
                    <NoteToggle
                      name={note.name}
                      group={note.group}
                      mode={mode}
                      state={answers.like.includes(note.handle) ? "like" : answers.avoid.includes(note.handle) ? "avoid" : null}
                      onToggle={() => setAnswers((a) => toggleNote(a, note.handle, mode))}
                    />
                  </li>
                ))}
              </ul>
            </Step>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => goTo(step - 1)} className="inline-flex min-h-12 items-center border border-ink px-6 text-sm hover:bg-ink hover:text-paper">
                Back
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => goTo(step + 1)} className="inline-flex min-h-12 items-center bg-ink px-6 text-sm text-paper hover:bg-ink/85">
                Next: {STEPS[step + 1]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resultsHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  resultsHeading.current?.focus({ preventScroll: true });
                }}
                className="inline-flex min-h-12 items-center bg-ink px-6 text-sm text-paper hover:bg-ink/85"
              >
                See my matches
              </button>
            )}
            {answered ? (
              <button
                type="button"
                onClick={() => {
                  setAnswers(EMPTY_ANSWERS);
                  goTo(0);
                }}
                className="ml-auto min-h-11 text-sm underline underline-offset-4 hover:no-underline"
              >
                Start over
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {answered && matches.length ? (
        <div className="finder-bar fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden">
          <p className="min-w-0 truncate text-sm">
            <span className="label text-muted">Best match</span> <span className="font-medium">{matches[0].product.title}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              resultsHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              resultsHeading.current?.focus({ preventScroll: true });
            }}
            className="inline-flex min-h-11 shrink-0 items-center bg-ink px-4 text-sm text-paper"
          >
            See {matches.length} {matches.length === 1 ? "match" : "matches"}
          </button>
        </div>
      ) : null}

      <aside aria-labelledby="results-title" className="lg:col-span-5">
        <div className="border border-line bg-paper-2 p-5 sm:p-6 lg:sticky lg:top-6">
          <h2 id="results-title" ref={resultsHeading} tabIndex={-1} className="text-xl font-medium focus:outline-none focus-visible:outline-2">
            Your matches
          </h2>
          <p className="sr-only" aria-live="polite">
            {answered
              ? matches.length
                ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}. Best: ${matches[0].product.title}.`
                : "No matches yet."
              : ""}
          </p>

          {!answered ? (
            <p className="mt-3 text-sm text-muted">Answer any question and the three closest fragrances appear here, each with the reasons it fits.</p>
          ) : matches.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing scores above zero with these answers. Try fewer notes to avoid, or another family.</p>
          ) : (
            <>
              <ol className="mt-4 space-y-3">
                {matches.map((match, i) => (
                  <li key={match.product.handle} className="flex gap-4 border border-line bg-paper p-3">
                    <div className="relative h-28 w-21 shrink-0 bg-wall">
                      {match.product.image ? (
                        <Image src={match.product.image.url} alt="" fill sizes="84px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="label text-muted">{i === 0 ? "Best match" : `Match ${i + 1}`}</p>
                      <h3 className="text-lg leading-tight font-medium">
                        <Link href={`/products/${match.product.handle}`} className="underline-offset-4 hover:underline">
                          {match.product.title}
                        </Link>
                      </h3>
                      <p className="label mt-0.5 flex items-center gap-2 text-muted">
                        {match.product.family} · From {formatPrice(match.product.price)}
                        {match.product.intensity ? <IntensityScale value={match.product.intensity} /> : null}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-sm">
                        {match.reasons.map((r) => (
                          <li key={r} className="flex gap-2">
                            <span aria-hidden="true">✓</span>
                            {r}
                          </li>
                        ))}
                        {match.warnings.map((w) => (
                          <li key={w} className="flex gap-2 text-muted">
                            <span aria-hidden="true">×</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>

              {set ? <SetSuggestion set={set} matchHandles={matches.map((m) => m.product.handle)} /> : null}
              <ShareLink />
              <p className="mt-4 text-xs text-muted">
                Scoring: family +3, strength +2 (close +1), occasion +2, each liked note +2, each avoided note −4.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Step({
  id,
  headingRef,
  title,
  hint,
  children,
}: {
  id: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 id={id} ref={headingRef} tabIndex={-1} className="text-[clamp(1.5rem,2.5vw,2rem)] font-medium focus:outline-none focus-visible:outline-2">
        {title}
      </h2>
      <p className="mt-1 mb-6 text-muted">{hint}</p>
      {children}
    </div>
  );
}

type ChoiceOption = { value: string; label: string; hint: string; swatch?: NoteGroup; scale?: Intensity };

function ChoiceGrid({
  name,
  type,
  options,
  isChecked,
  onChange,
}: {
  name: string;
  type: "radio" | "checkbox";
  options: ChoiceOption[];
  isChecked: (value: string) => boolean;
  onChange: (value: string, checked: boolean) => void;
}) {
  const uid = useId();
  return (
    <fieldset>
      <legend className="sr-only">{name}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const id = `${uid}-${o.value || "none"}`;
          const checked = isChecked(o.value);
          return (
            <label
              key={o.value || "none"}
              htmlFor={id}
              className={`flex min-h-16 cursor-pointer items-center gap-3 border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${checked ? "border-ink bg-paper outline-2 -outline-offset-2 outline-ink" : "border-control hover:border-ink"}`}
            >
              <input
                id={id}
                type={type}
                name={name}
                value={o.value}
                checked={checked}
                onChange={(e) => onChange(o.value, e.target.checked)}
                className="size-4 shrink-0 accent-ink"
              />
              {o.swatch ? <span aria-hidden="true" className={`size-8 shrink-0 border border-control ${NOTE_GROUP_BG[o.swatch]}`} /> : null}
              <span className="flex-1">
                <span className="block font-medium">{o.label}</span>
                <span className="block text-sm text-muted">{o.hint}</span>
              </span>
              {o.scale ? <IntensityScale value={o.scale} /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SetSuggestion({ set, matchHandles }: { set: FinderSet; matchHandles: string[] }) {
  const inSet = matchHandles.filter((h) => set.includes.includes(h)).length;
  return (
    <Link href={`/products/${set.handle}`} className="mt-4 flex items-center gap-4 border border-ink bg-paper p-3 hover:bg-paper-2">
      <div className="relative h-16 w-12 shrink-0 bg-wall">
        {set.image ? <Image src={set.image.url} alt="" fill sizes="48px" className="object-cover" /> : null}
      </div>
      <span className="text-sm">
        <span className="label block text-muted">Try before a full bottle</span>
        <span className="font-medium">{set.title}</span> holds {inSet} of these {inSet === 1 ? "match" : "matches"} as 2 ml sprays ·{" "}
        {formatPrice(set.price)}
      </span>
    </Link>
  );
}

function ShareLink() {
  const [status, setStatus] = useState("");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setStatus("Link copied");
          } catch {
            setStatus("Copy the address bar to share these results");
          }
        }}
        className="min-h-11 text-sm underline underline-offset-4 hover:no-underline"
      >
        Copy link to these results
      </button>
      <span role="status" className="text-sm text-muted">
        {status}
      </span>
    </div>
  );
}

function uniqueNotes(perfumes: PerfumeProfile[]): ProfileNote[] {
  const map = new Map<string, ProfileNote>();
  for (const p of perfumes) for (const n of p.notes) if (!map.has(n.handle)) map.set(n.handle, n);
  const order = (g: NoteGroup | null) => (g ? NOTE_GROUPS.indexOf(g) : NOTE_GROUPS.length);
  return [...map.values()].sort((a, b) => order(a.group) - order(b.group) || a.name.localeCompare(b.name));
}
