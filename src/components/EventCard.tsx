import { Link } from "react-router-dom";
import type { RescueEvent } from "../lib/types";
import { formatDateTime, telHref } from "../lib/format";
import { StatusBadge } from "./StatusBadge";

export function EventCard({ event, droneName }: { event: RescueEvent; droneName: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between">
      <Link
        to={`/app/akce/${event.id}`}
        className="flex flex-1 flex-col gap-1.5 transition-opacity hover:opacity-80"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          <span className="font-mono-nums text-sm font-semibold text-ink-soft">
            {formatDateTime(event.startTime)}
          </span>
        </div>
        <p className="font-display text-lg font-bold leading-tight">
          {event.locationName || "Místo zatím neuvedeno"}
          {event.areaHa != null && (
            <span className="ml-2 font-mono-nums text-sm font-normal text-ink-soft">
              {event.areaHa} ha
            </span>
          )}
        </p>
        <p className="text-sm text-ink-soft">
          {event.pilot || "bez pilota"} · {droneName}
        </p>
      </Link>

      <div className="flex items-center gap-5 text-sm">
        {event.status === "done" && (
          <div className="flex gap-4 font-mono-nums">
            <span title="Odchyceno">🦌 {event.caughtCount ?? "—"}</span>
            <span title="Vyhnáno">🏃 {event.chasedCount ?? "—"}</span>
          </div>
        )}
        {event.coordinatorPhone && (
          <a
            href={telHref(event.coordinatorPhone)}
            className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft hover:text-ink"
          >
            Koordinátor
          </a>
        )}
      </div>
    </div>
  );
}
