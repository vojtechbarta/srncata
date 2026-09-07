import { useState } from "react";
import type { CropType, Drone, EventStatus, NewRescueEvent, RescueEvent, TeamMember } from "../lib/types";
import { CROP_TYPES, DELETABLE_STATUSES, EVENT_STATUSES, STATUS_LABEL } from "../lib/types";
import { MapPreview } from "./MapPreview";

interface Props {
  initial?: RescueEvent;
  drones: Drone[];
  team: TeamMember[];
  onSave: (data: NewRescueEvent) => void;
  onDelete?: () => void;
  saving?: boolean;
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, drones, team, onSave, onDelete, saving }: Props) {
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? "draft");
  const [pilot, setPilot] = useState(initial?.pilot ?? "");
  const [droneId, setDroneId] = useState(initial?.droneId ?? "");
  const [coordinatorPhone, setCoordinatorPhone] = useState(initial?.coordinatorPhone ?? "");
  const [hunterContact, setHunterContact] = useState(initial?.hunterContact ?? "");
  const [otherContact, setOtherContact] = useState(initial?.otherContact ?? "");
  const [startTime, setStartTime] = useState(toDatetimeLocal(initial?.startTime ?? ""));
  const [locationName, setLocationName] = useState(initial?.locationName ?? "");
  const [mapsLink, setMapsLink] = useState(initial?.mapsLink ?? "");
  const [areaHa, setAreaHa] = useState(initial?.areaHa?.toString() ?? "");
  const [cropType, setCropType] = useState<CropType | "">(initial?.cropType ?? "");
  const [caughtCount, setCaughtCount] = useState(initial?.caughtCount?.toString() ?? "");
  const [chasedCount, setChasedCount] = useState(initial?.chasedCount?.toString() ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [photosLink, setPhotosLink] = useState(initial?.photosLink ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Mazat jde jen akci, která je uložená jako koncept nebo zrušená — u
  // potvrzené/odlétané se posuzuje uložený stav (initial), ne rozpracovaná
  // změna ve formuláři, aby smazání odpovídalo tomu, co je v databázi.
  const canDelete = !initial || DELETABLE_STATUSES.includes(initial.status);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      status,
      pilot: pilot.trim(),
      droneId: droneId || null,
      coordinatorPhone: coordinatorPhone.trim(),
      hunterContact: hunterContact.trim(),
      otherContact: otherContact.trim(),
      startTime: startTime ? new Date(startTime).toISOString() : "",
      locationName: locationName.trim(),
      mapsLink: mapsLink.trim(),
      areaHa: areaHa === "" ? null : Number(areaHa),
      cropType,
      caughtCount: caughtCount === "" ? null : Number(caughtCount),
      chasedCount: chasedCount === "" ? null : Number(chasedCount),
      note,
      photosLink: photosLink.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-wrap gap-2">
        {EVENT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              status === s
                ? "border-brand bg-brand text-brand-ink"
                : "border-line text-ink-soft hover:text-ink"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Název" full>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="např. Louka za Hošťálkovicemi"
          />
        </Field>

        <Field label="Čas zahájení">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="font-mono-nums"
            required
          />
        </Field>

        <Field label="Pilot">
          <input
            list="team-members"
            value={pilot}
            onChange={(e) => setPilot(e.target.value)}
            placeholder="Jméno pilota"
          />
          <datalist id="team-members">
            {team.map((m) => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
        </Field>

        <Field label="Dron">
          <select value={droneId ?? ""} onChange={(e) => setDroneId(e.target.value)}>
            <option value="">Zatím nevybráno</option>
            {drones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rozloha pole (ha)">
          <input
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={areaHa}
            onChange={(e) => setAreaHa(e.target.value)}
            placeholder="např. 3.5"
            className="font-mono-nums"
          />
        </Field>

        <Field label="Typ porostu">
          <select value={cropType} onChange={(e) => setCropType(e.target.value as CropType | "")}>
            <option value="">Zatím nevybráno</option>
            {CROP_TYPES.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Odkaz na Google Maps" full>
          <input
            type="url"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            placeholder="https://maps.google.com/…"
          />
        </Field>

        {mapsLink && (
          <div className="sm:col-span-2">
            <MapPreview mapsLink={mapsLink} />
          </div>
        )}

        <Field label="Telefon na koordinátora">
          <input
            type="tel"
            value={coordinatorPhone}
            onChange={(e) => setCoordinatorPhone(e.target.value)}
            placeholder="+420 …"
          />
        </Field>

        <Field label="Kontakt na myslivce">
          <input
            value={hunterContact}
            onChange={(e) => setHunterContact(e.target.value)}
            placeholder="jméno a/nebo telefon"
          />
        </Field>

        <Field label="Ostatní kontakt" full>
          <input
            value={otherContact}
            onChange={(e) => setOtherContact(e.target.value)}
            placeholder="např. sedlák, obec…"
          />
        </Field>

        <Field label="Odchyceno srnčat">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={caughtCount}
            onChange={(e) => setCaughtCount(e.target.value)}
            className="font-mono-nums"
          />
        </Field>

        <Field label="Vyhnáno srnčat">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={chasedCount}
            onChange={(e) => setChasedCount(e.target.value)}
            className="font-mono-nums"
          />
        </Field>

        <Field label="Odkaz na fotky (Google Disk)" full>
          <input
            type="url"
            value={photosLink}
            onChange={(e) => setPhotosLink(e.target.value)}
            placeholder="vlož odkaz na složku, kterou sis založil/a na Disku"
          />
        </Field>

        <Field label="Poznámka" full>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="cokoliv důležitého k akci…"
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 font-semibold text-brand-ink disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>

        {onDelete && canDelete && (
          confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Opravdu smazat?</span>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
              >
                Smazat
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft"
              >
                Zrušit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-ink-soft hover:text-red-600"
            >
              Smazat akci
            </button>
          )
        )}

        {onDelete && !canDelete && (
          <span className="text-sm text-ink-soft">
            Potvrzenou/odlétanou akci nelze smazat — nejdřív ji zrušte.
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-semibold text-ink-soft">{label}</span>
      <FieldStyles>{children}</FieldStyles>
    </label>
  );
}

/** Aplikuje sdílený vzhled inputů na jakýkoli vnořený form control. */
function FieldStyles({ children }: { children: React.ReactNode }) {
  return (
    <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3 [&_select]:py-2 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3 [&_textarea]:py-2">
      {children}
    </div>
  );
}
