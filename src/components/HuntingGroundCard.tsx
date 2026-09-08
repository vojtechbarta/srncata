import { useState } from "react";
import type { HuntingGround, NewHuntingGround } from "../lib/types";

interface Props {
  ground: HuntingGround;
  onSave: (data: NewHuntingGround) => void;
  onDelete: () => void;
}

export function HuntingGroundCard({ ground, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ground.name ?? "");
  const [mapLink, setMapLink] = useState(ground.mapLink ?? "");
  const [wardenContact, setWardenContact] = useState(ground.wardenContact ?? "");
  const [note, setNote] = useState(ground.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    onSave({
      name: name.trim(),
      mapLink: mapLink.trim(),
      wardenContact: wardenContact.trim(),
      note: note.trim(),
    });
    setEditing(false);
  }

  function cancel() {
    setName(ground.name ?? "");
    setMapLink(ground.mapLink ?? "");
    setWardenContact(ground.wardenContact ?? "");
    setNote(ground.note ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
        <LabeledInput label="Jméno honitby" value={name} onChange={setName} />
        <LabeledInput label="Odkaz na mapu" value={mapLink} onChange={setMapLink} type="url" />
        <LabeledInput label="Kontakt na hospodáře" value={wardenContact} onChange={setWardenContact} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-ink-soft">Poznámka</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="rounded-lg border border-line bg-bg px-3 py-2"
          />
        </label>
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
        <h3 className="font-display text-xl font-bold">{ground.name || "Bez jména"}</h3>
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Upravit
        </button>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <Row label="Mapa">
          {ground.mapLink ? (
            <a
              href={ground.mapLink}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Otevřít mapu ↗
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Hospodář">{ground.wardenContact || "—"}</Row>
      </dl>

      {ground.note && <p className="text-sm text-ink-soft">{ground.note}</p>}

      <div className="border-t border-line pt-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">Opravdu smazat?</span>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
            >
              Smazat
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
            Smazat honitbu
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 font-semibold text-ink-soft">{label}</dt>
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
