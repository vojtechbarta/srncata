import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { Drone, EventStatus, RescueEvent } from "../../lib/types";
import { EVENT_STATUSES, STATUS_LABEL } from "../../lib/types";
import { EventCard } from "../../components/EventCard";

type Filter = "all" | EventStatus;

export function EventsPage() {
  const { data: events, loading } = useCollection<RescueEvent>("events", [
    orderBy("startTime", "asc"),
  ]);
  const { data: drones } = useCollection<Drone>("drones");
  const [filter, setFilter] = useState<Filter>("all");

  const droneName = (id: string | null) => drones.find((d) => d.id === id)?.name ?? "bez dronu";

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.status === filter)),
    [events, filter],
  );

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
