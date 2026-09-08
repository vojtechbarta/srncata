import { useState } from "react";
import { dateKey } from "../lib/dateKey";
import { MONTH_NAMES, WEEKDAYS } from "../lib/calendarLabels";

interface Props {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}

/**
 * Kompaktní kalendář pro výběr rozsahu dat na jeden zátah — klik na den
 * nastaví začátek, další klik konec (appka je sama přehodí, když
 * uživatel klikne "pozpátku"), vybraný rozsah je v mřížce vidět
 * zvýrazněný. Ať se při zadávání "od" v jednom měsíci nemusí kvůli "do"
 * znovu proklikávat přes stejné měsíce.
 */
export function DateRangePicker({ from, to, onChange }: Props) {
  const today = new Date();
  const initialMonth = from ? new Date(from) : today;
  const [cursor, setCursor] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  function handleDayClick(day: Date) {
    const key = dateKey(day);
    if (!from || (from && to)) {
      // Nový výběr (nic zatím vybráno, nebo předchozí rozsah už byl hotový).
      onChange({ from: key, to: "" });
    } else if (key < from) {
      onChange({ from: key, to: from });
    } else {
      onChange({ from, to: key });
    }
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dateKey(today);

  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Předchozí měsíc"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
        >
          ←
        </button>
        <p className="text-sm font-semibold">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Další měsíc"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-soft hover:text-ink"
        >
          →
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-soft">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = dateKey(d);
          const isEndpoint = key === from || key === to;
          const inRange = !!from && !!to && key > from && key < to;
          const isToday = key === todayKey;
          const colorClass = isEndpoint
            ? "bg-brand text-brand-ink font-semibold"
            : inRange
              ? "bg-brand/20 text-ink"
              : "text-ink-soft hover:bg-bg-raised";
          return (
            <button
              type="button"
              key={i}
              onClick={() => handleDayClick(d)}
              className={`flex aspect-square items-center justify-center rounded-lg font-mono-nums text-sm transition-colors ${colorClass} ${
                isToday && !isEndpoint ? "ring-1 ring-brand" : ""
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
