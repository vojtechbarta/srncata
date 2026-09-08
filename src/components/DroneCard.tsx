import { useState } from "react";
import { Link } from "react-router-dom";
import type { Drone, RescueEvent, TeamMember } from "../lib/types";
import { formatDateTime } from "../lib/format";
import { StatusBadge } from "./StatusBadge";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

interface Props {
  drone: Drone;
  upcoming: RescueEvent[];
  /** Všechny akce tohoto dronu (bez ohledu na datum/stav) — pro kalendář obsazenosti. */
  allEvents: RescueEvent[];
  pilots: TeamMember[];
  onSave: (data: { registrationNumber: string; currentHolder: string; note: string }) => void;
}

export function DroneCard({ drone, upcoming, allEvents, pilots, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState(drone.registrationNumber ?? "");
  const [holder, setHolder] = useState(drone.currentHolder);
  const [note, setNote] = useState(drone.note);

  function save() {
    onSave({ registrationNumber: registrationNumber.trim(), currentHolder: holder, note });
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold">{drone.name}</h3>
          {drone.registrationNumber && (
            <p className="font-mono-nums text-xs text-ink-soft">{drone.registrationNumber}</p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Upravit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink-soft">Registrační číslo</span>
            <input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 font-mono-nums"
              placeholder="např. CZ-UA-123456"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink-soft">Aktuálně u koho</span>
            <select
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2"
            >
              <option value="">— nezadáno —</option>
              {pilots.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
              {holder && !pilots.some((p) => p.name === holder) && (
                <option value={holder}>{holder} (není v seznamu pilotů)</option>
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink-soft">Poznámka</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2"
              placeholder="např. potřebuje nabít baterie"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink"
            >
              Uložit
            </button>
            <button
              onClick={() => {
                setRegistrationNumber(drone.registrationNumber ?? "");
                setHolder(drone.currentHolder);
                setNote(drone.note);
                setEditing(false);
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft"
            >
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-ink-soft">Aktuálně u koho</p>
          <p className="font-mono-nums text-lg font-semibold">
            {drone.currentHolder || "— nezadáno —"}
          </p>
          {drone.note && <p className="mt-1 text-sm text-ink-soft">{drone.note}</p>}
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-soft">Nadcházející rezervace</p>
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            📅 Kalendář obsazenosti
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-soft">Zatím nic naplánováno — dron je volný.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((ev) => (
              <li key={ev.id}>
                <Link
                  to={`/app/akce/${ev.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-bg px-3 py-2 text-sm transition-opacity hover:opacity-80"
                >
                  <div>
                    <p className="font-mono-nums font-semibold">{formatDateTime(ev.startTime)}</p>
                    <p className="text-ink-soft">
                      {ev.pilot || "bez pilota"} · {ev.locationName || "místo neuvedeno"}
                    </p>
                  </div>
                  <StatusBadge status={ev.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCalendar && (
        <AvailabilityCalendar
          title={drone.name}
          events={allEvents}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}
