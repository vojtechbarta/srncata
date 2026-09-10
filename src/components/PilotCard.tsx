import { useState } from "react";
import type { NewTeamMember, RescueEvent, TeamMember, UnavailabilityWindow } from "../lib/types";
import { dateKey } from "../lib/dateKey";
import { formatDateShort } from "../lib/format";
import { newId } from "../lib/id";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { DateRangePicker } from "./DateRangePicker";

interface Props {
  pilot: TeamMember;
  /** Všechny akce tohoto pilota (bez ohledu na datum/stav) — pro kalendář obsazenosti a kontrolu kolizí. */
  events: RescueEvent[];
  onSave: (data: NewTeamMember) => void;
  /** Chybí, když přihlášený uživatel tohohle konkrétního pilota nesmí
   *  z týmu odebrat (viz `canDelete` v PilotsPage) — pak se tlačítko
   *  vůbec nezobrazí, místo aby po kliknutí tiše selhalo na pravidlech. */
  onDelete?: () => void;
  /** Přidá období nedostupnosti a zároveň (pokud nějaké jsou) odebere
   * pilota z akcí, které se s ním kryjí — `conflictingEventIds` jsou id
   * akcí, u kterých se má pole "Pilot" vyprázdnit. */
  onAddUnavailability: (window: UnavailabilityWindow, conflictingEventIds: string[]) => void;
  onRemoveUnavailability: (windowId: string) => void;
}

export function PilotCard({ pilot, events, onSave, onDelete, onAddUnavailability, onRemoveUnavailability }: Props) {
  const [editing, setEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [name, setName] = useState(pilot.name ?? "");
  const [email, setEmail] = useState(pilot.email ?? "");
  const [phone, setPhone] = useState(pilot.phone ?? "");
  const [address, setAddress] = useState(pilot.address ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [pendingConflicts, setPendingConflicts] = useState<RescueEvent[] | null>(null);

  function save() {
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      // setDoc při uložení přepíše celý dokument — období nedostupnosti se
      // v tomhle formuláři needituje, tak ho musíme poslat beze změny,
      // jinak by uložení základních údajů zbytek smazalo.
      unavailability: pilot.unavailability ?? [],
    });
    setEditing(false);
  }

  function cancel() {
    setName(pilot.name ?? "");
    setEmail(pilot.email ?? "");
    setPhone(pilot.phone ?? "");
    setAddress(pilot.address ?? "");
    setEditing(false);
  }

  /** Akce tohoto pilota (koncept/potvrzeno), které spadají do zadaného rozsahu dat. */
  function conflictsInRange(from: string, to: string): RescueEvent[] {
    return events.filter((e) => {
      if (e.status !== "draft" && e.status !== "confirmed") return false;
      const day = dateKey(e.startTime);
      return day !== "" && day >= from && day <= to;
    });
  }

  function commitAddUnavailability(from: string, to: string, conflicts: RescueEvent[]) {
    onAddUnavailability({ id: newId(), from, to }, conflicts.map((e) => e.id));
    setNewFrom("");
    setNewTo("");
    setPendingConflicts(null);
  }

  function handleAddClick() {
    if (!newFrom || !newTo) return;
    const conflicts = conflictsInRange(newFrom, newTo);
    if (conflicts.length > 0) {
      setPendingConflicts(conflicts);
    } else {
      commitAddUnavailability(newFrom, newTo, []);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
        <LabeledInput label="Jméno" value={name} onChange={setName} />
        <LabeledInput label="E-mail" value={email} onChange={setEmail} type="email" />
        <LabeledInput label="Telefon" value={phone} onChange={setPhone} type="tel" />
        <LabeledInput label="Adresa" value={address} onChange={setAddress} />
        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink"
          >
            Uložit
          </button>
          <button
            onClick={cancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft"
          >
            Zrušit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl font-bold">{pilot.name || "Bez jména"}</h3>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            📅 Kalendář obsazenosti
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Upravit
          </button>
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <Row label="E-mail">
          <a href={`mailto:${pilot.email}`} className="underline underline-offset-2">
            {pilot.email}
          </a>
        </Row>
        <Row label="Telefon">
          {pilot.phone ? (
            <a href={`tel:${pilot.phone.replace(/\s+/g, "")}`} className="underline underline-offset-2">
              {pilot.phone}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Adresa">{pilot.address || "—"}</Row>
      </dl>

      <div className="border-t border-line pt-3">
        <p className="mb-2 text-sm font-semibold text-ink-soft">Nedostupnost</p>
        {(pilot.unavailability ?? []).length === 0 ? (
          <p className="text-sm text-ink-soft">Žádné období nedostupnosti.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {(pilot.unavailability ?? []).map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-bg px-3 py-2 text-sm"
              >
                <span className="font-mono-nums">
                  {formatDateShort(w.from)} – {formatDateShort(w.to)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveUnavailability(w.id)}
                  aria-label="Odebrat období nedostupnosti"
                  className="text-ink-soft hover:text-status-cancelled"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendingConflicts ? (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-status-cancelled bg-bg p-3 text-sm">
            <p>
              V tomhle období má {pilot.name || "pilot"} přiřazené akce:{" "}
              {pendingConflicts.map((e) => e.locationName || "bez názvu").join(", ")}. Opravdu přidat
              nedostupnost a odebrat ho z těchto akcí?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => commitAddUnavailability(newFrom, newTo, pendingConflicts)}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
              >
                Ano
              </button>
              <button
                type="button"
                onClick={() => setPendingConflicts(null)}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft"
              >
                Zrušit
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col items-start gap-2">
            <DateRangePicker
              from={newFrom}
              to={newTo}
              onChange={(next) => {
                setNewFrom(next.from);
                setNewTo(next.to);
              }}
            />
            <p className="text-xs text-ink-soft">
              {newFrom && !newTo
                ? "Teď klikněte na poslední den nedostupnosti."
                : "Klikněte na první a poslední den nedostupnosti."}
            </p>
            <button
              type="button"
              onClick={handleAddClick}
              disabled={!newFrom || !newTo}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              Přidat období
            </button>
          </div>
        )}
      </div>

      {onDelete && (
        <div className="border-t border-line pt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Opravdu odebrat z týmu?</span>
              <button
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
              >
                Odebrat
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft"
              >
                Zrušit
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-ink-soft hover:text-red-600"
            >
              Odebrat z týmu
            </button>
          )}
        </div>
      )}

      {showCalendar && (
        <AvailabilityCalendar
          title={pilot.name || "Bez jména"}
          events={events}
          unavailability={pilot.unavailability}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 font-semibold text-ink-soft">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-bg px-3 py-2"
      />
    </label>
  );
}
