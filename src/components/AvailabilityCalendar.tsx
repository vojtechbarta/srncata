import { useEffect, useMemo, useState } from "react";
import type { RescueEvent, UnavailabilityWindow } from "../lib/types";
import { dateKey } from "../lib/dateKey";

interface Props {
  /** Jméno dronu nebo pilota — jen jako titulek popupu. */
  title: string;
  /** Všechny akce tohoto dronu/pilota (bez ohledu na datum/stav) —
   * obsazenost se dopočítá tady, appka jen posílá surová data. */
  events: RescueEvent[];
  /** Období nedostupnosti — jen u pilotů (dron ho nemá), dny se obarví šedě. */
  unavailability?: UnavailabilityWindow[];
  onClose: () => void;
}

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTH_NAMES = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

/**
 * Popup s měsíčním kalendářem obsazenosti (dronu nebo pilota) — na první
 * pohled vidět, který den je volný. Potvrzená akce červeně, koncept
 * oranžově (může se ještě posunout/zrušit, ale na ten den se radši
 * neplánujte), nedostupnost (jen piloti) šedě, jinak zeleně (volno).
 * Odlétané a zrušené akce den neblokují — odlétáno je vždycky v minulosti
 * a zrušeno je zase volno. Den s akcí jde prokliknout na její detail
 * (nový tab).
 */
export function AvailabilityCalendar({ title, events, unavailability, onClose }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const statusByDay = useMemo(() => {
    const map = new Map<string, { status: "confirmed" | "draft"; eventId: string }>();
    for (const ev of events) {
      if (ev.status !== "draft" && ev.status !== "confirmed") continue;
      const key = dateKey(ev.startTime);
      // Potvrzená akce má přednost před konceptem, kdyby na stejný den
      // (výjimečně) byly obě.
      if (ev.status === "confirmed") {
        map.set(key, { status: "confirmed", eventId: ev.id });
      } else if (!map.has(key)) {
        map.set(key, { status: "draft", eventId: ev.id });
      }
    }
    return map;
  }, [events]);

  const unavailableSet = useMemo(() => {
    const set = new Set<string>();
    for (const w of unavailability ?? []) {
      const start = new Date(w.from);
      const end = new Date(w.to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      // Od druhého dne dál počítáme čistě v místním kalendáři (bez dalšího
      // parsování řetězce), ať nehrozí posun kolem půlnoci.
      for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        set.add(dateKey(d));
      }
    }
    return set;
  }, [unavailability]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Kalendář obsazenosti — ${title}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Předchozí měsíc"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
          >
            ←
          </button>
          <p className="font-semibold">
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Další měsíc"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
          >
            →
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = dateKey(d);
            const match = statusByDay.get(key);
            const isUnavailable = unavailableSet.has(key);
            const isToday = key === todayKey;
            const colorClass =
              match?.status === "confirmed"
                ? "bg-red-500/25 text-red-200"
                : match?.status === "draft"
                  ? "bg-amber-500/25 text-amber-200"
                  : isUnavailable
                    ? "bg-slate-500/30 text-slate-300"
                    : "bg-emerald-500/15 text-emerald-200";
            const cellClass = `flex aspect-square items-center justify-center rounded-lg font-mono-nums text-sm ${colorClass} ${
              isToday ? "ring-2 ring-brand" : ""
            }`;

            if (match) {
              return (
                <a
                  key={i}
                  href={`/app/akce/${match.eventId}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Otevřít akci v novém tabu"
                  className={`${cellClass} hover:opacity-80`}
                >
                  {d.getDate()}
                </a>
              );
            }
            return (
              <div key={i} className={cellClass}>
                {d.getDate()}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" /> Potvrzeno
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" /> Koncept
          </span>
          {unavailability && unavailability.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500/70" /> Nedostupný
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" /> Volno
          </span>
        </div>
      </div>
    </div>
  );
}
