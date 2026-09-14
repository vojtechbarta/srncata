/** Jeden řádek vodorovného pruhového grafu — popisek, pruh podle poměru k `max`, hodnota. */
export function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate text-ink-soft" title={label}>
        {label}
      </span>
      <div className="h-2.5 flex-1 rounded-full bg-line">
        <div
          className="h-2.5 rounded-full"
          style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, background: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono-nums font-semibold">{value}</span>
    </div>
  );
}
