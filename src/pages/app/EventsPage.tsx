import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { Drone, EventStatus, RescueEvent } from "../../lib/types";
import { EVENT_STATUSES, STATUS_LABEL } from "../../lib/types";
import { EventCard } from "../../components/EventCard";

type Filter = "all" | EventStatus;
/** "all" = všichni piloti, "none" = bez pilota, jinak konkrétní jméno. */
type PilotFilter = "all" | "none" | string;

export function EventsPage() {
  const { data: events, loading } = useCollection<RescueEvent>("events", [
    orderBy("startTime", "asc"),
  ]);
  const { data: drones } = useCollection<Drone>("drones");
  const [filter, setFilter] = useState<Filter>("all");
  const [pilotFilter, setPilotFilter] = useState<PilotFilter>("all");

  const droneName = (id: string | null) => drones.find((d) => d.id === id)?.name ?? "bez dronu";

  // Jména pilotů, co se v akcích doopravdy vyskytují (Pilot je ve
  // formuláři volný text, ne vazba na tým — nabízíme jen to, co je
  // reálně přiřazené, ne celý seznam týmu).
  const pilotNames = useMemo(() => {
    const names = new Set<string>();
    for (const e of events) if (e.pilot) names.add(e.pilot);
    return [...names].sort((a, b) => a.localeCompare(b, "cs"));
  }, [events]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? events : events.filter((e) => e.status === filter);
    if (pilotFilter === "none") list = list.filter((e) => !e.pilot);
    else if (pilotFilter !== "all") list = list.filter((e) => e.pilot === pilotFilter);
    return list;
  }, [events, filter, pilotFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Akce</h1>
        <Link
          to="/app/akce/nova"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink"
        >
          + Nová akce
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            Vše ({events.length})
          </FilterTab>
          {EVENT_STATUSES.map((s) => (
            <FilterTab key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_LABEL[s]} ({events.filter((e) => e.status === s).length})
            </FilterTab>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Pilot
          <select
            value={pilotFilter}
            onChange={(e) => setPilotFilter(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-ink"
          >
            <option value="all">Všichni</option>
            <option value="none">Bez pilota</option>
            {pilotNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
          Žádné akce v této kategorii.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} droneName={droneName(ev.droneId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? "border-ink bg-ink text-bg" : "border-line text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
