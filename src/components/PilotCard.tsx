import { useState } from "react";
import type { NewTeamMember, RescueEvent, TeamMember } from "../lib/types";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

interface Props {
  pilot: TeamMember;
  /** Všechny akce tohoto pilota (bez ohledu na datum/stav) — pro kalendář obsazenosti. */
  events: RescueEvent[];
  onSave: (data: NewTeamMember) => void;
  onDelete: () => void;
}

export function PilotCard({ pilot, events, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [name, setName] = useState(pilot.name ?? "");
  const [email, setEmail] = useState(pilot.email ?? "");
  const [phone, setPhone] = useState(pilot.phone ?? "");
  const [address, setAddress] = useState(pilot.address ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() });
    setEditing(false);
  }

  function cancel() {
    setName(pilot.name ?? "");
    setEmail(pilot.email ?? "");
    setPhone(pilot.phone ?? "");
    setAddress(pilot.address ?? "");
    setEditing(false);
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

      {showCalendar && (
        <AvailabilityCalendar
          title={pilot.name || "Bez jména"}
          events={events}
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
