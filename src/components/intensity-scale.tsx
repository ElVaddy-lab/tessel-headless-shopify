/** Three squares: the mosaic motif as an intensity scale (1 light – 3 intense). */
export function IntensityScale({ value }: { value: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Intensity ${value} of 3`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`size-2 border ${step <= value ? "border-ink bg-ink" : "border-control bg-transparent"}`}
        />
      ))}
    </span>
  );
}
