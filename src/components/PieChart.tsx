interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Jednoduchý koláčový graf (CSS conic-gradient, žádná knihovna) s legendou vedle. */
export function PieChart({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;
  const stops = segments
    .map((s) => {
      const from = total > 0 ? (cumulative / total) * 360 : 0;
      cumulative += s.value;
      const to = total > 0 ? (cumulative / total) * 360 : 0;
      return `${s.color} ${from}deg ${to}deg`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-5">
      <div
        className="h-28 w-28 shrink-0 rounded-full"
        style={{ background: total > 0 ? `conic-gradient(${stops})` : "var(--line)" }}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      />
      <div className="flex flex-col gap-2 text-sm">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            {s.label}: <span className="font-mono-nums font-semibold text-ink">{s.value}</span>
            {total > 0 && (
              <span className="text-ink-soft">({Math.round((s.value / total) * 100)}&nbsp;%)</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
