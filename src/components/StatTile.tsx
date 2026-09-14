/** Jedna velká dlaždice s číslem a popiskem — souhrnná statistika. */
export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-5 text-center">
      <p className="font-mono-nums text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
