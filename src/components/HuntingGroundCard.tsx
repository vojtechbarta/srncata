import { useState } from "react";
import { OMS_OPTIONS, type HuntingGround, type NewHuntingGround, type Oms } from "../lib/types";

interface Props {
  ground: HuntingGround;
  onSave: (data: NewHuntingGround) => void;
  onDelete: () => void;
}

// Honiteb bude v evidenci hodně, takže je řádek ve výchozím stavu jen
// jeden řádek (jméno + okres) — detaily (mapa, hospodář, poznámka, akce)
// se zobrazí až po rozkliknutí, ať se v delším seznamu dá rychle scrollovat.
export function HuntingGroundCard({ ground, onSave, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ground.name ?? "");
  const [district, setDistrict] = useState(ground.district ?? "");
  const [oms, setOms] = useState<Oms | "">(ground.oms ?? "");
  const [mapLink, setMapLink] = useState(ground.mapLink ?? "");
  const [wardenName, setWardenName] = useState(ground.wardenName ?? "");
  const [wardenPhone, setWardenPhone] = useState(ground.wardenPhone ?? "");
  const [note, setNote] = useState(ground.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    onSave({
      name: name.trim(),
      district: district.trim(),
      oms,
      mapLink: mapLink.trim(),
      wardenName: wardenName.trim(),
      wardenPhone: wardenPhone.trim(),
      note: note.trim(),
    });
    setEditing(false);
  }

  function cancel() {
    setName(ground.name ?? "");
    setDistrict(ground.district ?? "");
    setOms(ground.oms ?? "");
    setMapLink(ground.mapLink ?? "");
    setWardenName(ground.wardenName ?? "");
    setWardenPhone(ground.wardenPhone ?? "");
    setNote(ground.note ?? "");
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-line bg-bg-raised">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="font-display text-base font-bold">{ground.name || "Bez jména"}</span>
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm text-ink-soft">
            {[ground.wardenName, ground.wardenPhone, ground.district].filter(Boolean).join(" · ") ||
              "—"}
          </span>
          <span className={`shrink-0 text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-line px-4 py-4">
          {editing ? (
            <div className="flex flex-col gap-3">
              <LabeledInput label="Jméno honitby" value={name} onChange={setName} />
              <LabeledInput label="Okres" value={district} onChange={setDistrict} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-ink-soft">OMS</span>
                <select
                  value={oms}
                  onChange={(e) => setOms(e.target.value as Oms | "")}
                  className="rounded-lg border border-line bg-bg px-3 py-2"
                >
                  <option value="">— nevybráno —</option>
                  {OMS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <LabeledInput label="Odkaz na mapu" value={mapLink} onChange={setMapLink} type="url" />
              <LabeledInput label="Jméno hospodáře" value={wardenName} onChange={setWardenName} />
              <LabeledInput label="Telefon na hospodáře" value={wardenPhone} onChange={setWardenPhone} type="tel" />
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
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <dl className="flex flex-col gap-1.5 text-sm">
                  <Row label="Okres">{ground.district || "—"}</Row>
                  <Row label="OMS">{ground.oms || "—"}</Row>
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
                  <Row label="Hospodář">{ground.wardenName || "—"}</Row>
                  <Row label="Telefon">
                    {ground.wardenPhone ? (
                      <a href={`tel:${ground.wardenPhone}`} className="underline underline-offset-2">
                        {ground.wardenPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Row>
                </dl>
                <button
                  onClick={() => setEditing(true)}
                  className="shrink-0 text-sm font-semibold text-brand hover:underline"
                >
                  Upravit
                </button>
              </div>

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
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 font-semibold text-ink-soft">{label}</dt>
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
