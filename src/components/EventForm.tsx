import { useEffect, useMemo, useState } from "react";
import type {
  CropType,
  Drone,
  EventFieldItem,
  EventStatus,
  NewRescueEvent,
  RescueEvent,
  TeamMember,
  UnavailabilityWindow,
} from "../lib/types";
import { CROP_TYPES, DELETABLE_STATUSES, EVENT_STATUSES, STATUS_LABEL } from "../lib/types";
import { formatDateShort } from "../lib/format";
import { extractLatLng } from "../lib/maps";
import { dateKey } from "../lib/dateKey";
import { MapPreview } from "./MapPreview";
import { EventFieldsEditor } from "./EventFieldsEditor";

interface Props {
  initial?: RescueEvent;
  drones: Drone[];
  team: TeamMember[];
  events: RescueEvent[];
  onSave: (data: NewRescueEvent) => void;
  onDelete?: () => void;
  /** Zahodí rozpracované změny a vrátí se zpět bez uložení. */
  onCancel?: () => void;
  saving?: boolean;
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, drones, team, events, onSave, onDelete, onCancel, saving }: Props) {
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

  const selectedDateKey = startTime.slice(0, 10);

  // Akce (jiné než tahle), co mají stejný dron/pilota stejný den — dron i
  // pilot občas legitimně obslouží víc akcí za den (předání, dvě zásahy
  // ráno po sobě), tak se to jen nahlas připomene a musí se to potvrdit
  // zaškrtnutím, nevyřazuje se to z výběru.
  const droneConflictEvents = useMemo(() => {
    if (!droneId || !selectedDateKey) return [];
    return events.filter(
      (ev) =>
        ev.id !== initial?.id &&
        ev.droneId === droneId &&
        (ev.status === "confirmed" || ev.status === "draft") &&
        dateKey(ev.startTime) === selectedDateKey,
    );
  }, [events, droneId, selectedDateKey, initial?.id]);

  const pilotConflictEvents = useMemo(() => {
    if (!pilot || !selectedDateKey) return [];
    return events.filter(
      (ev) =>
        ev.id !== initial?.id &&
        ev.pilot === pilot &&
        (ev.status === "confirmed" || ev.status === "draft") &&
        dateKey(ev.startTime) === selectedDateKey,
    );
  }, [events, pilot, selectedDateKey, initial?.id]);

  const [ackDroneConflict, setAckDroneConflict] = useState(false);
  const [ackPilotConflict, setAckPilotConflict] = useState(false);

  // Nedostupnost pilota (viz PilotsPage) je na rozdíl od "víc akcí za den"
  // výše tvrdé omezení — pilot na dovolené/mimo prostě vybrat nejde. Kdykoli
  // vybraný pilot do nedostupnosti spadne, appka výběr sama zruší a nechá
  // viditelnou poznámku proč.
  const pilotUnavailability = useMemo(() => {
    if (!selectedDateKey || !pilot) return null;
    const member = team.find((m) => m.name === pilot);
    return member?.unavailability?.find((w) => selectedDateKey >= w.from && selectedDateKey <= w.to) ?? null;
  }, [team, pilot, selectedDateKey]);

  const [autoRemovedPilot, setAutoRemovedPilot] = useState<{
    name: string;
    window: UnavailabilityWindow;
  } | null>(null);
  useEffect(() => {
    if (pilotUnavailability && pilot) {
      setAutoRemovedPilot({ name: pilot, window: pilotUnavailability });
      setPilot("");
    }
  }, [pilotUnavailability, pilot]);

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

  // Sledování rozpracované (neuložené) změny — kvůli potvrzení při
  // "Zrušit změny" a varování při zavření tabu/okna. Porovnáváme aktuální
  // stav s jednou zachyceným snímkem při načtení (líný init přes useState,
  // spočítaný jen napoprvé) — ne přes "změnilo se něco po mountu" hlídané
  // efektem, což se v dev StrictModu (dvojí spuštění efektů) chovalo
  // nespolehlivě.
  const [initialSnapshot] = useState(() =>
    JSON.stringify({
      status: initial?.status ?? "draft",
      pilot: initial?.pilot ?? "",
      droneId: initial?.droneId ?? "",
      coordinatorPhone: initial?.coordinatorPhone ?? "",
      hunterContact: initial?.hunterContact ?? "",
      otherContact: initial?.otherContact ?? "",
      startTime: toDatetimeLocal(initial?.startTime ?? ""),
      locationName: initial?.locationName ?? "",
      mapsLink: initial?.mapsLink ?? "",
      areaHa: initial?.areaHa?.toString() ?? "",
      cropType: initial?.cropType ?? "",
      caughtCount: initial?.caughtCount?.toString() ?? "",
      chasedCount: initial?.chasedCount?.toString() ?? "",
      deadCount: initial?.deadCount?.toString() ?? "",
      note: initial?.note ?? "",
      photosLink: initial?.photosLink ?? "",
      fields: initial?.fields ?? [],
    }),
  );

  const dirty = useMemo(
    () =>
      JSON.stringify({
        status,
        pilot,
        droneId,
        coordinatorPhone,
        hunterContact,
        otherContact,
        startTime,
        locationName,
        mapsLink,
        areaHa,
        cropType,
        caughtCount,
        chasedCount,
        deadCount,
        note,
        photosLink,
        fields,
      }) !== initialSnapshot,
    [
      status,
      pilot,
      droneId,
      coordinatorPhone,
      hunterContact,
      otherContact,
      startTime,
      locationName,
      mapsLink,
      areaHa,
      cropType,
      caughtCount,
      chasedCount,
      deadCount,
      note,
      photosLink,
      fields,
      initialSnapshot,
    ],
  );

  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const [confirmCancel, setConfirmCancel] = useState(false);

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
              setAutoRemovedPilot(null);
              setAckDroneConflict(false);
              setAckPilotConflict(false);
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
            onChange={(e) => {
              setAutoRemovedPilot(null);
              setAckPilotConflict(false);
              setPilot(e.target.value);
            }}
            placeholder="Jméno pilota"
          />
          <datalist id="team-members">
            {team
              .filter((m) => {
                if (!selectedDateKey) return true;
                return !m.unavailability?.some((w) => selectedDateKey >= w.from && selectedDateKey <= w.to);
              })
              .map((m) => (
                <option key={m.id} value={m.name} />
              ))}
          </datalist>
          {autoRemovedPilot && (
            <p className="mt-1.5 text-sm font-semibold text-status-cancelled">
              {autoRemovedPilot.name} byl odebrán — v tomto období ({formatDateShort(autoRemovedPilot.window.from)}{" "}
              – {formatDateShort(autoRemovedPilot.window.to)}) je nedostupný. Vyberte prosím jiného pilota
              nebo změňte datum.
            </p>
          )}
          {pilotConflictEvents.length > 0 && (
            <label className="mt-1.5 flex items-start gap-2 rounded-lg border border-status-cancelled bg-bg p-2.5 text-sm">
              <input
                type="checkbox"
                checked={ackPilotConflict}
                onChange={(e) => setAckPilotConflict(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                Beru na vědomí, že pilot {pilot} má víc akcí tento den (
                {pilotConflictEvents.map((e) => e.locationName || "bez názvu").join(", ")}).
              </span>
            </label>
          )}
        </Field>

        <Field label="Dron">
          <select
            value={droneId ?? ""}
            onChange={(e) => {
              setAckDroneConflict(false);
              setDroneId(e.target.value);
            }}
          >
            <option value="">Zatím nevybráno</option>
            {drones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {droneConflictEvents.length > 0 && (
            <label className="mt-1.5 flex items-start gap-2 rounded-lg border border-status-cancelled bg-bg p-2.5 text-sm">
              <input
                type="checkbox"
                checked={ackDroneConflict}
                onChange={(e) => setAckDroneConflict(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                Beru na vědomí, že dron {drones.find((d) => d.id === droneId)?.name ?? "vybraný"} má víc akcí
                tento den ({droneConflictEvents.map((e) => e.locationName || "bez názvu").join(", ")}).
              </span>
            </label>
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
            eventName={locationName}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={
              saving ||
              (droneConflictEvents.length > 0 && !ackDroneConflict) ||
              (pilotConflictEvents.length > 0 && !ackPilotConflict)
            }
            title={
              (droneConflictEvents.length > 0 && !ackDroneConflict) ||
              (pilotConflictEvents.length > 0 && !ackPilotConflict)
                ? "Nejdřív potvrďte upozornění na víc akcí ten stejný den."
                : undefined
            }
            className="rounded-full bg-brand px-6 py-2.5 font-semibold text-brand-ink disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit"}
          </button>

          {onCancel && (
            confirmCancel ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-soft">Zahodit neuložené změny?</span>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
                >
                  Zahodit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft"
                >
                  Zpět
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (dirty ? setConfirmCancel(true) : onCancel())}
                className="rounded-full border border-line px-6 py-2.5 font-semibold text-ink-soft hover:text-ink"
              >
                Zrušit změny
              </button>
            )
          )}
        </div>

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
    <div className="[&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-lg [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-line [&_input:not([type=checkbox])]:bg-bg [&_input:not([type=checkbox])]:px-3 [&_input:not([type=checkbox])]:py-2 [&_input[type=checkbox]]:h-4 [&_input[type=checkbox]]:w-4 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3 [&_select]:py-2 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3 [&_textarea]:py-2">
      {children}
    </div>
  );
}
