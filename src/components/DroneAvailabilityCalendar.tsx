import { useEffect, useMemo, useState } from "react";
import type { RescueEvent } from "../lib/types";

interface Props {
  droneName: string;
  /** Všechny akce tohoto dronu (bez ohledu na datum/stav) — obsazenost se
   * dopočítá tady, appka jen posílá surová data. */
  events: RescueEvent[];
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

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Popup s měsíčním kalendářem obsazenosti jednoho dronu — na první pohled
 * vidět, který den je volný. Potvrzená akce červeně, koncept oranžově
 * (může se ještě posunout/zrušit, ale dron si na ten den radši neplánujte),
 * jinak zeleně (volno). Odlétané a zrušené akce den neblokují — odlétáno
 * je vždycky v minulosti a zrušeno je zase volno.
 */
export function DroneAvailabilityCalendar({ droneName, events, onClose }: Props) {
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
    const map = new Map<string, "confirmed" | "draft">();
    for (const ev of events) {
      if (ev.status !== "draft" && ev.status !== "confirmed") continue;
      const key = dateKey(new Date(ev.startTime));
      if (ev.status === "confirmed") {
        map.set(key, "confirmed");
      } else if (!map.has(key)) {
        map.set(key, "draft");
      }
    }
    return map;
  }, [events]);

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
      aria-label={`Kalendář obsazenosti — ${droneName}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold">{droneName}</h3>
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
            const status = statusByDay.get(key);
            const isToday = key === todayKey;
            const colorClass =
              status === "confirmed"
                ? "bg-red-500/25 text-red-200"
                : status === "draft"
                  ? "bg-amber-500/25 text-amber-200"
                  : "bg-emerald-500/15 text-emerald-200";
            return (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-lg font-mono-nums text-sm ${colorClass} ${
                  isToday ? "ring-2 ring-brand" : ""
                }`}
              >
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
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" /> Volno
          </span>
        </div>
      </div>
    </div>
  );
}
