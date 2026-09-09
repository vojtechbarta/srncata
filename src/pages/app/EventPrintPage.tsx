import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection } from "../../lib/useCollection";
import type { Drone, HuntingGround, RescueEvent, StoredEventFieldItem } from "../../lib/types";
import { fromStoredEventFields, STATUS_LABEL } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { extractLatLng } from "../../lib/maps";
import { FieldBoundaryMap } from "../../components/FieldBoundaryMap";

/**
 * Samostatná (bez zbytku appky kolem — mimo AppLayout, stejně jako
 * FieldMapPage) tisková verze akce — pro předání pilotovi/koordinátorovi,
 * co s sebou nemá appku (zástup, špatný signál na místě). Vždy světlé
 * "papírové" barvy bez ohledu na motiv appky — je to dokument k
 * vytištění/uložení jako PDF (tlačítko Tisknout volá window.print(),
 * "Uložit jako PDF" jde v tiskovém dialogu vybrat jako cíl).
 */
export function EventPrintPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<RescueEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: drones } = useCollection<Drone>("drones");
  const { data: huntingGrounds } = useCollection<HuntingGround>("huntingGrounds");

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "events", id)).then((snap) => {
      if (snap.exists()) {
        const raw = snap.data() as Omit<RescueEvent, "id" | "fields"> & {
          fields?: StoredEventFieldItem[];
        };
        setEvent({ id: snap.id, ...raw, fields: fromStoredEventFields(raw.fields) });
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="p-6 text-center text-gray-500">Načítání…</p>;
  if (!event) return <p className="p-6 text-center text-gray-500">Akce nenalezena.</p>;

  const droneName = drones.find((d) => d.id === event.droneId)?.name ?? "bez dronu";
  const huntingGround = huntingGrounds.find((g) => g.id === event.huntingGroundId) ?? null;
  const coords = extractLatLng(event.mapsLink);

  return (
    <div className="min-h-svh bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            to={`/app/akce/${event.id}`}
            className="text-sm font-semibold text-gray-500 hover:text-black"
          >
            ← Zpět na akci
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
          >
            🖨️ Tisknout / uložit jako PDF
          </button>
        </div>

        <header className="mb-6 border-b-2 border-black pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {STATUS_LABEL[event.status]}
            {event.kind === "other" && " · Jiný výjezd"}
          </p>
          <h1 className="text-3xl font-bold">{event.locationName || "Akce bez názvu"}</h1>
          <p className="mt-1 text-lg font-semibold">{formatDateTime(event.startTime)}</p>
        </header>

        <Section title="Základní údaje">
          <Row label="Pilot">{event.pilot || "—"}</Row>
          <Row label="Dron">{droneName}</Row>
          {event.kind !== "other" && (
            <>
              <Row label="Rozloha pole (odhad)">{event.areaHa != null ? `${event.areaHa} ha` : "—"}</Row>
              {event.volunteerCount != null && (
                <Row label="Dobrovolníci">
                  {event.volunteerCount}
                  {event.hasNewcomers && " (jsou mezi nimi nováčci)"}
                </Row>
              )}
              <Row label="Myslivec bude přítomen">{event.hunterExpected ? "Ano" : "Ne"}</Row>
            </>
          )}
          {event.note && <Row label="Poznámka">{event.note}</Row>}
        </Section>

        <Section title="Kontakty">
          <Row label="Koordinátor">{event.coordinatorPhone || "—"}</Row>
          {event.kind !== "other" && (
            <>
              <Row label="Myslivec">{event.hunterContact || "—"}</Row>
              {huntingGround && (
                <Row label="Honitba">
                  {huntingGround.name}
                  {(huntingGround.wardenName || huntingGround.wardenPhone) && (
                    <>
                      {" "}
                      — hospodář:{" "}
                      {[huntingGround.wardenName, huntingGround.wardenPhone].filter(Boolean).join(", ")}
                    </>
                  )}
                </Row>
              )}
            </>
          )}
          {event.otherContact && <Row label="Další kontakty">{event.otherContact}</Row>}
        </Section>

        <Section title="Lokace">
          <Row label="Místo srazu">{event.mapsLink || "—"}</Row>
          {coords && (
            <Row label="Souřadnice">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </Row>
          )}
          {event.kind !== "other" && event.cropType && <Row label="Typ porostu">{event.cropType}</Row>}
          {coords && (
            <div className="mt-1">
              <FieldBoundaryMap
                fields={[{ label: "Místo srazu", lpisCode: "", lat: coords.lat, lng: coords.lng, polygon: [] }]}
                captionMode="none"
                showLayerSwitcher={false}
                className="h-48 w-full rounded-lg border border-gray-300"
              />
            </div>
          )}
        </Section>

        {event.fields.length > 0 && (
          <Section title="Pole v pořadí sečení" avoidBreak={false}>
            {event.fields.length > 1 && (
              <div className="break-inside-avoid">
                <FieldBoundaryMap
                  fields={event.fields}
                  showLayerSwitcher={false}
                  className="mb-3 h-64 w-full rounded-lg border border-gray-300"
                />
              </div>
            )}
            <ol className="flex flex-col gap-3">
              {event.fields.map((f, i) => (
                <li key={f.id} className="break-inside-avoid rounded-lg border border-gray-300 p-3">
                  <p className="font-semibold">
                    {i + 1}. {f.label || "bez popisku"}
                    {f.time && <span className="ml-2 font-normal text-gray-600">({f.time})</span>}
                  </p>
                  <p className="text-sm text-gray-700">
                    {[
                      f.lpisCode && `LPIS ${f.lpisCode}`,
                      f.owner,
                      f.areaHa != null ? `${f.areaHa} ha` : null,
                      `${f.lat.toFixed(6)}, ${f.lng.toFixed(6)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {f.ownerAddress && <p className="text-sm text-gray-700">{f.ownerAddress}</p>}
                  <FieldBoundaryMap
                    fields={[f]}
                    captionMode="none"
                    showLayerSwitcher={false}
                    className="mt-2 h-40 w-full rounded-lg border border-gray-300"
                  />
                </li>
              ))}
            </ol>
          </Section>
        )}

        {event.kind !== "other" && (
          <Section title="Záznam po akci (doplnit ručně)">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <WriteLine label="Odchyceno srnčat" />
              <WriteLine label="Vyhnáno srnčat" />
              <WriteLine label="Nalezeno mrtvých srnčat" />
              <WriteLine label="Skutečná rozloha (ha)" />
            </div>
            <p className="mt-3 text-sm">Myslivec přítomen: ○ Ano&nbsp;&nbsp;&nbsp;○ Ne</p>
            <p className="mt-3 text-sm font-semibold text-gray-600">Poznámka po akci</p>
            <div className="mt-1 h-24 rounded-lg border border-gray-300" />
          </Section>
        )}

        <p className="mt-8 text-xs text-gray-400 print:mt-4">
          Vytištěno {formatDateTime(new Date().toISOString())} — Záchraň srnče Moravskoslezský kraj z.s.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  avoidBreak = true,
}: {
  title: string;
  children: React.ReactNode;
  /** false u dlouhých sekcí (seznam polí s mapami) — ať se aspoň smí
   * rozlomit mezi stránky, místo aby se celá přesunula na další. Každá
   * jednotlivá položka uvnitř má vlastní break-inside-avoid. */
  avoidBreak?: boolean;
}) {
  return (
    <section className={`mb-6 ${avoidBreak ? "break-inside-avoid" : ""}`}>
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wide text-gray-600">
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-40 shrink-0 font-semibold text-gray-600">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function WriteLine({ label }: { label: string }) {
  return (
    <div>
      <p className="text-gray-600">{label}</p>
      <div className="mt-1 h-8 border-b border-gray-400" />
    </div>
  );
}
