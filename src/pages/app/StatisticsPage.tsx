import { useMemo } from "react";
import { useCollection } from "../../lib/useCollection";
import type { RescueEvent } from "../../lib/types";
import { byCropType, byMonth, byPilot, summarize } from "../../lib/statistics";
import { StatTile } from "../../components/StatTile";
import { BarRow } from "../../components/BarRow";

export function StatisticsPage() {
  const { data: events, loading } = useCollection<RescueEvent>("events");

  const summary = useMemo(() => summarize(events), [events]);
  const pilotStats = useMemo(() => byPilot(events), [events]);
  const cropStats = useMemo(() => byCropType(events), [events]);
  const monthStats = useMemo(() => byMonth(events), [events]);

  const maxPilot = Math.max(1, ...pilotStats.map((b) => b.value));
  const maxCrop = Math.max(1, ...cropStats.map((b) => b.value));
  const maxMonth = Math.max(1, ...monthStats.map((b) => b.value));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Statistiky</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Součet ze všech odlétaných akcí ({summary.eventCount}) — koncepty, potvrzené a zrušené akce se do čísel
          nepočítají.
        </p>
      </div>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile value={String(summary.eventCount)} label="celkem výjezdů" />
            <StatTile value={String(summary.rescued)} label="zachráněno srnčat" />
            <StatTile value={String(summary.caught)} label="odchyceno (pod košem)" />
            <StatTile value={String(summary.chased)} label="vyhnáno" />
            <StatTile value={String(summary.dead)} label="nalezeno mrtvých" />
            <StatTile
              value={summary.areaHa.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })}
              label="proletěno ha"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-bg-raised p-5">
              <h2 className="font-display text-lg font-bold">Jakým stylem</h2>
              {summary.rescued === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">Zatím žádné odlétané akce s výsledkem.</p>
              ) : (
                <>
                  <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full">
                    <div
                      style={{ width: `${(summary.caught / summary.rescued) * 100}%`, background: "var(--meadow)" }}
                    />
                    <div
                      style={{ width: `${(summary.chased / summary.rescued) * 100}%`, background: "var(--brand)" }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-ink-soft">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: "var(--meadow)" }} />
                      Pod košem: <span className="font-mono-nums font-semibold text-ink">{summary.caught}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} />
                      Vyhnáno: <span className="font-mono-nums font-semibold text-ink">{summary.chased}</span>
                    </span>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-bg-raised p-5">
              <h2 className="font-display text-lg font-bold">Podle typu porostu</h2>
              <div className="mt-4 flex flex-col gap-3">
                {cropStats.length === 0 ? (
                  <p className="text-sm text-ink-soft">Zatím žádná data.</p>
                ) : (
                  cropStats.map((b) => (
                    <BarRow key={b.label} label={b.label} value={b.value} max={maxCrop} color="var(--meadow)" />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-bg-raised p-5 lg:col-span-2">
              <h2 className="font-display text-lg font-bold">Podle pilota</h2>
              <div className="mt-4 flex flex-col gap-3">
                {pilotStats.length === 0 ? (
                  <p className="text-sm text-ink-soft">Zatím žádná data.</p>
                ) : (
                  pilotStats.map((b) => (
                    <BarRow key={b.label} label={b.label} value={b.value} max={maxPilot} color="var(--brand)" />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-bg-raised p-5 lg:col-span-2">
              <h2 className="font-display text-lg font-bold">Podle měsíce</h2>
              <div className="mt-4 flex flex-col gap-3">
                {monthStats.length === 0 ? (
                  <p className="text-sm text-ink-soft">Zatím žádná data.</p>
                ) : (
                  monthStats.map((b) => (
                    <BarRow key={b.label} label={b.label} value={b.value} max={maxMonth} color="var(--brand)" />
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
