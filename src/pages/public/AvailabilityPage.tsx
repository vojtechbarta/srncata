import { useMemo, useState } from "react";
import { useCollection } from "../../lib/useCollection";
import type { PublicAvailabilityDay } from "../../lib/types";
import { dateKey } from "../../lib/dateKey";
import { MONTH_NAMES, WEEKDAYS } from "../../lib/calendarLabels";

/**
 * Veřejný orientační kalendář — jestli má smysl se ozvat, než reálně
 * napíšou. Čte jen agregovanou kolekci `publicAvailability` (žádná jména,
 * kontakty ani detaily akcí — viz `firestore.rules` a
 * `src/lib/publicAvailability.ts`, které ji přepočítává).
 */
export function AvailabilityPage() {
  const { data: days, loading } = useCollection<PublicAvailabilityDay>("publicAvailability");

  const byDate = useMemo(() => {
    const map = new Map<string, PublicAvailabilityDay>();
    for (const d of days) map.set(d.date, d);
    return map;
  }, [days]);

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  // JS getDay(): Ne=0..So=6 — přemapováno na Po=0..Ne=6, ať se týden začíná pondělím.
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dateKey(today);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Dostupnost <span className="text-ink-soft">(Beta)</span>
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Máme volný termín?</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Orientační přehled, jestli bychom v daný den teoreticky mohli vyrazit s dronem. Pokud je den
        obsazený, ale jde o urgentní případ, klidně se nám i tak ozvěte — naše potvrzená akce může být
        třeba v jinou hodinu a mohli bychom to stihnout i tak.
      </p>

      {loading ? (
        <p className="mt-10 text-ink-soft">Načítání…</p>
      ) : (
        <div className="mt-10 rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              disabled={isCurrentMonth}
              aria-label="Předchozí měsíc"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink disabled:opacity-30"
            >
              ←
            </button>
            <p className="font-display text-lg font-bold">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Další měsíc"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
            >
              →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ink-soft">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = dateKey(d);
              const info = byDate.get(key);
              const isPast = key < todayKey;
              const isToday = key === todayKey;

              // Plná kapacita (všechny drony volné) zeleně, částečná
              // (aspoň jeden volný, ale ne všechny — např. "1/2") oranžově,
              // ať je vidět rozdíl mezi "jistě" a "možná, ale omezeně".
              const isPartial = !!info && info.canFly && info.dronesFree < info.dronesTotal;
              const colorClass = isPast
                ? "bg-bg text-ink-soft/40"
                : !info
                  ? "bg-bg text-ink-soft/60"
                  : !info.canFly
                    ? "bg-red-500/15 text-red-200"
                    : isPartial
                      ? "bg-amber-500/15 text-amber-200"
                      : "bg-emerald-500/15 text-emerald-200";

              return (
                <div
                  key={i}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg ${colorClass} ${
                    isToday ? "ring-2 ring-brand" : ""
                  }`}
                >
                  <span className="font-mono-nums text-sm font-semibold">{d.getDate()}</span>
                  {!isPast && info && (
                    <span className="font-mono-nums text-[10px] leading-tight">
                      {info.dronesFree}/{info.dronesTotal}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" /> Má smysl se ozvat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" /> Máme jen omezenou kapacitu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" /> Teď nejspíš ne
            </span>
            <span>Číslo = kolik dronů je ten den volno.</span>
          </div>
        </div>
      )}
    </section>
  );
}
