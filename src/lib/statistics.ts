import type { CropType, RescueEvent } from "./types";

/** Jen odlétané akce mají smysluplné výsledky (caughtCount/chasedCount se
 * vyplňují až po akci) — koncepty/potvrzené/zrušené do statistik nepočítáme. */
export function doneEvents(events: RescueEvent[]): RescueEvent[] {
  return events.filter((e) => e.status === "done");
}

/** "Zachráněno" = součet odchycených (pod košem) a vyhnaných mimo sečenou
 * plochu — stejná definice jako na veřejném webu (HomePage). */
export function rescuedCount(e: Pick<RescueEvent, "caughtCount" | "chasedCount">): number {
  return (e.caughtCount ?? 0) + (e.chasedCount ?? 0);
}

export interface StatsSummary {
  eventCount: number;
  caught: number;
  chased: number;
  rescued: number;
  dead: number;
  areaHa: number;
}

/** Skutečná rozloha, když je vyplněná, jinak odhad — stejné pravidlo jako
 * jednotlivé pole "Skutečná rozloha (ha)" v EventForm. */
function effectiveAreaHa(e: Pick<RescueEvent, "actualAreaHa" | "areaHa">): number {
  return e.actualAreaHa ?? e.areaHa ?? 0;
}

export function summarize(events: RescueEvent[]): StatsSummary {
  const done = doneEvents(events);
  return {
    eventCount: done.length,
    caught: done.reduce((sum, e) => sum + (e.caughtCount ?? 0), 0),
    chased: done.reduce((sum, e) => sum + (e.chasedCount ?? 0), 0),
    rescued: done.reduce((sum, e) => sum + rescuedCount(e), 0),
    dead: done.reduce((sum, e) => sum + (e.deadCount ?? 0), 0),
    areaHa: done.reduce((sum, e) => sum + effectiveAreaHa(e), 0),
  };
}

export interface StatBucket {
  label: string;
  value: number;
}

/** Seskupí a sečte "zachráněno" podle libovolného klíče, seřazené sestupně
 * podle hodnoty. `keyOf` vrátí `null`, když se akce do žádné skupiny
 * nezařazuje (např. bez pilota) — taková akce se do výsledku nepočítá. */
function groupRescued(events: RescueEvent[], keyOf: (e: RescueEvent) => string | null): StatBucket[] {
  const totals = new Map<string, number>();
  for (const e of doneEvents(events)) {
    const key = keyOf(e);
    if (key === null) continue;
    totals.set(key, (totals.get(key) ?? 0) + rescuedCount(e));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/** Podle pilota (volný text u akce, viz `RescueEvent.pilot`) — prázdné jméno vynecháno. */
export function byPilot(events: RescueEvent[]): StatBucket[] {
  return groupRescued(events, (e) => (e.pilot.trim() ? e.pilot.trim() : null));
}

/** Podle typu porostu — nevyplněné jde do "Neuvedeno". */
export function byCropType(events: RescueEvent[]): StatBucket[] {
  return groupRescued(events, (e) => (e.cropType ? e.cropType : "Neuvedeno") as CropType | "Neuvedeno");
}

/** Podle měsíce (sezónní přehled), chronologicky — na rozdíl od ostatních
 * skupin NEřadíme podle hodnoty, pořadí v čase je tu to podstatné. */
export function byMonth(events: RescueEvent[]): StatBucket[] {
  const totals = new Map<string, number>();
  for (const e of doneEvents(events)) {
    const d = new Date(e.startTime);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + rescuedCount(e));
  }
  const MONTHS = [
    "leden",
    "únor",
    "březen",
    "duben",
    "květen",
    "červen",
    "červenec",
    "srpen",
    "září",
    "říjen",
    "listopad",
    "prosinec",
  ];
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      return { label: `${MONTHS[Number(month) - 1]} ${year}`, value };
    });
}
