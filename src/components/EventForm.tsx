import { useEffect, useMemo, useState } from "react";
import type {
  CropType,
  Drone,
  EventFieldItem,
  EventStatus,
  NewRescueEvent,
  RescueEvent,
  TeamMember,
} from "../lib/types";
import { CROP_TYPES, DELETABLE_STATUSES, EVENT_STATUSES, STATUS_LABEL } from "../lib/types";
import { formatDateShort } from "../lib/format";
import { extractLatLng } from "../lib/maps";
import { MapPreview } from "./MapPreview";
import { EventFieldsEditor } from "./EventFieldsEditor";

interface Props {
  initial?: RescueEvent;
  drones: Drone[];
  team: TeamMember[];
  events: RescueEvent[];
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

/** ISO datetime -> "2026-09-08", pro porovnání "je to stejný den" bez ohledu na čas. */
function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function EventForm({ initial, drones, team, events, onSave, onDelete, saving }: Props) {
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
  const [deadCount, setDeadCount] = useState(initial?.deadCount?.toString() ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [photosLink, setPhotosLink] = useState(initial?.photosLink ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Mazat jde jen akci, která je uložená jako koncept nebo zrušená — u
  // potvrzené/odlétané se posuzuje uložený stav (initial), ne rozpracovaná
  // změna ve formuláři, aby smazání odpovídalo tomu, co je v databázi.
  const canDelete = !initial || DELETABLE_STATUSES.includes(initial.status);

  // Kolize rezervace dronu: stejný dron, stejný den (bez ohledu na hodinu —
  // dron má realisticky jen jeden let za den), jiná akce než tahle. Kolize
  // s POTVRZENOU akcí dron úplně vyřadí z výběru; kolize jen s konceptem
  // je spíš varování, protože koncept se ještě může posunout/zrušit.
  const selectedDateKey = startTime.slice(0, 10);
  const droneConflicts = useMemo(() => {
    const confirmed = new Map<string, RescueEvent>();
    const draft = new Map<string, RescueEvent>();
    if (!selectedDateKey) return { confirmed, draft };
    for (const ev of events) {
      if (ev.id === initial?.id) continue;
      if (!ev.droneId) continue;
      if (ev.status !== "confirmed" && ev.status !== "draft") continue;
      if (dateKeyFromIso(ev.startTime) !== selectedDateKey) continue;
      if (ev.status === "confirmed" && !confirmed.has(ev.droneId)) confirmed.set(ev.droneId, ev);
      if (ev.status === "draft" && !draft.has(ev.droneId)) draft.set(ev.droneId, ev);
    }
    return { confirmed, draft };
  }, [events, selectedDateKey, initial?.id]);

  // Pokud vybraný dron mezitím spadne do kolize s potvrzenou akcí (změna
  // data, nebo se jiná akce mezitím potvrdila), výběr sám zrušíme — nejde
  // ho nechat vybraný, když ho vybrat nejde. Zároveň si o tom necháme
  // viditelnou poznámku, ať uživatel nezůstane s tichým zmizelým dronem.
  const [autoRemovedDrone, setAutoRemovedDrone] = useState<{ name: string; conflict: RescueEvent } | null>(
    null,
  );
  useEffect(() => {
    if (droneId && droneConflicts.confirmed.has(droneId)) {
      const conflict = droneConflicts.confirmed.get(droneId)!;
      setAutoRemovedDrone({ name: drones.find((d) => d.id === droneId)?.name ?? "Dron", conflict });
      setDroneId("");
    }
  }, [droneId, droneConflicts, drones]);

  const draftConflict = droneId ? droneConflicts.draft.get(droneId) : undefined;

  // Pole/body v akci (nepovinné) — dohledané buď podle čísla půdního
  // bloku, nebo podle bodu na mapě (viz EventFieldsEditor + src/lib/lpis.ts).
  // Při každé změně dopočítáme součet rozlohy a orientační "Místo srazu"
  // ze středu všech položek — manuální úprava obojího zůstává vždycky
  // možná, tohle jen předvyplní rozumný výchozí stav.
  const [fields, setFields] = useState<EventFieldItem[]>(initial?.fields ?? []);

  function handleFieldsChange(next: EventFieldItem[]) {
    setFields(next);
    if (next.length === 0) return;

    const totalArea = next.reduce((sum, f) => sum + (f.areaHa ?? 0), 0);
    if (totalArea > 0) setAreaHa(String(Math.round(totalArea * 100) / 100));

    const lat = next.reduce((sum, f) => sum + f.lat, 0) / next.length;
    const lng = next.reduce((sum, f) => sum + f.lng, 0) / next.length;
    setMapsLink(`https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`);
  }

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
      fields,
      caughtCount: caughtCount === "" ? null : Number(caughtCount),
      chasedCount: chasedCount === "" ? null : Number(chasedCount),
      deadCount: deadCount === "" ? null : Number(deadCount),
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
            onChange={(e) => {
              setAutoRemovedDrone(null);
              setStartTime(e.target.value);
            }}
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
          <select
            value={droneId ?? ""}
            onChange={(e) => {
              setAutoRemovedDrone(null);
              setDroneId(e.target.value);
            }}
          >
            <option value="">Zatím nevybráno</option>
            {drones.map((d) => {
              const conflict = droneConflicts.confirmed.get(d.id);
              return (
                <option key={d.id} value={d.id} disabled={!!conflict}>
                  {d.name}
                  {conflict ? ` — obsazeno ${formatDateShort(conflict.startTime)}` : ""}
                </option>
              );
            })}
          </select>
          {autoRemovedDrone && (
            <p className="mt-1.5 text-sm font-semibold text-status-cancelled">
              {autoRemovedDrone.name} byl odebrán — {formatDateShort(autoRemovedDrone.conflict.startTime)} už
              ho má potvrzený u akce
              {autoRemovedDrone.conflict.locationName ? ` „${autoRemovedDrone.conflict.locationName}“` : ""}.
              Vyberte prosím jiný dron nebo změňte datum.
            </p>
          )}
          {draftConflict && (
            <p className="mt-1.5 text-sm text-status-cancelled">
              Pozor, dron je ve stejný den vybraný i pro koncept
              {draftConflict.locationName ? ` „${draftConflict.locationName}“` : ""} — zkontrolujte, ať se
              akce nekříží.
            </p>
          )}
        </Field>

        <Field label="Rozloha pole (ha)">
          <input
            type="number"
            min={0}
            step="0.01"
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

        <Field label="Místo srazu (Google Maps)" full>
          <input
            type="text"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            placeholder="https://maps.google.com/… nebo rovnou souřadnice"
          />
          <p className="mt-1.5 text-sm text-ink-soft">
            Jde vložit i souřadnice rovnou, např. „49.81164374558394, 18.140180100228207“.
          </p>
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

        <Field label="Nalezeno mrtvých srnčat">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={deadCount}
            onChange={(e) => setDeadCount(e.target.value)}
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

        <div className="sm:col-span-2">
          <EventFieldsEditor
            fields={fields}
            onChange={handleFieldsChange}
            referencePoint={extractLatLng(mapsLink)}
          />
        </div>
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
