import { useState } from "react";
import type { EventFieldItem } from "../lib/types";
import { findLpisBlockAtPoint, findLpisBlocks, type LatLng, type LpisMatch } from "../lib/lpis";
import { extractLatLng } from "../lib/maps";
import { downloadMappingKmz } from "../lib/djiWpml";
import { FieldBoundaryMap, type MapField } from "./FieldBoundaryMap";

interface Props {
  fields: EventFieldItem[];
  onChange: (fields: EventFieldItem[]) => void;
  /** Orientační bod (typicky z pole "Místo srazu") pro řazení shod podle vzdálenosti. */
  referencePoint: LatLng | null;
}

function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/** LPIS adresu "Klimkovice,Lagnovská,č.p.669,74283" zobrazí čitelněji. */
function formatAddress(address: string): string {
  return address.replace(/,/g, ", ");
}

/** Odkaz na FieldMapPage (samostatná stránka jen s mapou) — data se posílají
 * přímo v URL, funguje i pro ještě neuloženou akci. */
function mapLinkHref(f: EventFieldItem, index: number): string {
  const mapField: MapField = {
    label: f.label || f.lpisCode || `Bod ${index + 1}`,
    lpisCode: f.lpisCode,
    lat: f.lat,
    lng: f.lng,
    polygon: f.polygon,
  };
  return `/mapa?data=${encodeURIComponent(JSON.stringify(mapField))}`;
}

/**
 * Pole/body v rámci jedné akce — jde přidávat oběma směry (podle čísla
 * půdního bloku, nebo podle bodu na mapě), řadit podle pořadí sečení a
 * ke každému doplnit vlastní popisek a odhad času. Viz `src/lib/lpis.ts`.
 */
export function EventFieldsEditor({ fields, onChange, referencePoint }: Props) {
  const [codeInput, setCodeInput] = useState("");
  const [pointInput, setPointInput] = useState("");
  const [loading, setLoading] = useState<"code" | "point" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<LpisMatch[] | null>(null);

  function addItem(base: Omit<EventFieldItem, "id" | "label" | "time">) {
    onChange([...fields, { id: newId(), label: "", time: "", ...base }]);
    setError(null);
    setChoices(null);
  }

  function addFromMatch(match: LpisMatch) {
    const code = match.fullCode || match.code;
    if (fields.some((f) => f.lpisCode === code)) {
      setError(`Blok „${code}“ už v seznamu je.`);
      setChoices(null);
      return;
    }
    addItem({
      lpisCode: code,
      owner: match.owner,
      ownerAddress: match.ownerAddress,
      areaHa: match.areaHa,
      lat: match.lat,
      lng: match.lng,
      polygon: match.polygon,
    });
    setCodeInput("");
  }

  async function handleAddByCode() {
    const code = codeInput.trim();
    if (!code) return;
    setLoading("code");
    setError(null);
    setChoices(null);
    try {
      const matches = await findLpisBlocks(code, referencePoint);
      if (matches.length === 0) {
        setError(`Blok „${code}“ se v Moravskoslezském kraji nenašel. Zkontrolujte prosím číslo.`);
      } else if (matches.length === 1) {
        addFromMatch(matches[0]);
      } else {
        setChoices(matches);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se spojit s LPIS.");
    } finally {
      setLoading(null);
    }
  }

  async function handleAddByPoint() {
    const raw = pointInput.trim();
    if (!raw) return;
    const point = extractLatLng(raw);
    if (!point) {
      setError("Z tohohle odkazu/textu se nepodařilo vyčíst souřadnice.");
      return;
    }
    setLoading("point");
    setError(null);
    setChoices(null);
    try {
      const match = await findLpisBlockAtPoint(point);
      if (match) {
        const code = match.fullCode || match.code;
        if (fields.some((f) => f.lpisCode === code)) {
          setError(`Blok „${code}“ na tomhle místě už v seznamu je.`);
          return;
        }
        addItem({
          lpisCode: code,
          owner: match.owner,
          ownerAddress: match.ownerAddress,
          areaHa: match.areaHa,
          lat: point.lat,
          lng: point.lng,
          polygon: match.polygon,
        });
      } else {
        // Hranice se nenašla (les, zástavba, mezera v datech…) — přidáme
        // aspoň samotný bod, ať appka pilota nenechá bez ničeho.
        addItem({
          lpisCode: "",
          owner: "",
          ownerAddress: "",
          areaHa: null,
          lat: point.lat,
          lng: point.lng,
          polygon: [],
        });
      }
      setPointInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se spojit s LPIS.");
    } finally {
      setLoading(null);
    }
  }

  function updateItem(id: string, patch: Partial<EventFieldItem>) {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeItem(id: string) {
    onChange(fields.filter((f) => f.id !== id));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-line bg-bg-raised p-4">
      <p className="text-sm font-semibold text-ink-soft">
        Pole v akci <span className="font-normal">— nepovinné</span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Přidávejte v pořadí, ve kterém se bude sekat — jde přeřadit šipkami. Ke každému lze dohledat
        hranici buď podle čísla půdního bloku (LPIS), nebo naopak podle bodu na mapě, když má appka jen
        souřadnice od zemědělce/myslivce. Zkrácený odkaz (maps.app.goo.gl) appka nerozbalí sama — otevřete
        ho jednou v prohlížeči a vložte sem výslednou celou adresu.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddByCode();
              }
            }}
            placeholder="číslo bloku, např. 0701/1"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono-nums text-sm"
          />
          <button
            type="button"
            onClick={handleAddByCode}
            disabled={loading !== null || !codeInput.trim()}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
          >
            {loading === "code" ? "Hledám…" : "Podle bloku"}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={pointInput}
            onChange={(e) => setPointInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddByPoint();
              }
            }}
            placeholder="odkaz na Google Maps nebo „49.86, 18.19“"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddByPoint}
            disabled={loading !== null || !pointInput.trim()}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
          >
            {loading === "point" ? "Hledám…" : "Podle bodu"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-status-cancelled">{error}</p>}

      {choices && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-sm text-ink-soft">
            Našlo se víc bloků s tímhle číslem v Moravskoslezském kraji — vyberte ten správný
            {choices[0]?.distanceKm != null && " (seřazeno od nejbližšího k místu srazu)"}:
          </p>
          {choices.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => addFromMatch(m)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-left text-sm hover:opacity-80"
            >
              <span className="font-mono-nums font-semibold">{m.fullCode}</span> — {m.district}
              {m.owner && `, ${m.owner}`}
              {m.areaHa != null && `, ${m.areaHa} ha`}
              {m.culture && `, ${m.culture}`}
              {m.distanceKm != null && (
                <span className="font-mono-nums text-ink-soft"> · ~{m.distanceKm.toFixed(1)} km</span>
              )}
            </button>
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <ol className="mt-3 flex flex-col gap-2">
          {fields.map((f, index) => (
            <li key={f.id} className="rounded-lg border border-line bg-bg p-3">
              <div className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col items-center gap-0.5 pt-1">
                  <span className="font-mono-nums text-xs text-ink-soft">{index + 1}.</span>
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label="Posunout nahoru"
                    className="text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Posunout dolů"
                    className="text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    value={f.label}
                    onChange={(e) => updateItem(f.id, { label: e.target.value })}
                    placeholder="popisek (např. jméno zemědělce)"
                    className="w-full rounded-lg border border-line bg-bg-raised px-3 py-1.5 text-sm sm:flex-1"
                  />
                  <input
                    type="time"
                    value={f.time}
                    onChange={(e) => updateItem(f.id, { time: e.target.value })}
                    aria-label="Odhad času sečení"
                    className="w-full rounded-lg border border-line bg-bg-raised px-3 py-1.5 font-mono-nums text-sm sm:w-32"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(f.id)}
                  aria-label="Odebrat"
                  className="shrink-0 text-ink-soft hover:text-status-cancelled"
                >
                  ✕
                </button>
              </div>

              <p className="mt-1.5 pl-6 text-xs text-ink-soft">
                {f.lpisCode ? (
                  <>
                    <span className="font-mono-nums">{f.lpisCode}</span>
                    {f.areaHa != null && ` · ${f.areaHa} ha`}
                    {f.owner && ` · ${f.owner}`}
                    {f.ownerAddress && ` (${formatAddress(f.ownerAddress)})`}
                  </>
                ) : (
                  "jen bod — hranice bloku se nenašla"
                )}
              </p>

              <div className="mt-2 pl-6">
                <FieldBoundaryMap fields={[f]} captionMode="none" className="h-40 w-full rounded-lg border border-line" />
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={mapLinkHref(f, index)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
                  >
                    Otevřít mapu v novém okně ↗
                  </a>
                  {f.polygon.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadMappingKmz({ name: f.label || f.lpisCode || `pole-${index + 1}`, polygon: f.polygon })
                      }
                      title="Naimportujte do DJI Pilot 2 (Knihovna tras) — appka podle hranice sama dopočítá letový plán. Zatím ověřeno jen podle dokumentace DJI, ne na reálném dronu — první export doporučujeme jen zkusit naimportovat a zkontrolovat."
                      className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
                    >
                      Export pro DJI Pilot 2 (.kmz)
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {fields.length > 0 && (
        <div className="mt-3">
          <FieldBoundaryMap fields={fields} />
        </div>
      )}
    </div>
  );
}
