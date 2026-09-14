import type { CropType, RescueEvent } from "./types";

/** Starší akce bez vyplněného `kind` se všude v appce čtou jako "fawn"
 * (viz `?? "fawn"` v EventDetailPage) — stejné pravidlo platí i tady. */
function isFawn(e: RescueEvent): boolean {
  return (e.kind ?? "fawn") === "fawn";
}

function isOtherKind(e: RescueEvent): boolean {
  return !isFawn(e);
}

/** Jen odlétané akce mají smysluplné výsledky (caughtCount/chasedCount se
 * vyplňují až po akci) — koncepty/potvrzené/zrušené do statistik nepočítáme. */
export function doneEvents(events: RescueEvent[]): RescueEvent[] {
  return events.filter((e) => e.status === "done");
}

/** Odlétané akce typu Záchrana srnčat — základ pro statistiky v sekci
 * "Srnčata" (caughtCount/chasedCount/typ porostu apod. dávají smysl jen
 * u nich, ne u přednášky nebo jiného výjezdu). */
export function doneFawnEvents(events: RescueEvent[]): RescueEvent[] {
  return doneEvents(events).filter(isFawn);
}

/** Odlétané akce, co NEJSOU záchrana srnčat (přednáška pro školy, jiný
 * výjezd) — základ pro sekci "Jiné akce". */
export function doneOtherEvents(events: RescueEvent[]): RescueEvent[] {
  return doneEvents(events).filter(isOtherKind);
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

/** Souhrn za Záchranu srnčat — jiné typy výjezdu (přednáška, jiný výjezd)
 * do něj nepatří, viz `doneOtherEvents`/sekce "Jiné akce". */
export function summarize(events: RescueEvent[]): StatsSummary {
  const done = doneFawnEvents(events);
  return {
    eventCount: done.length,
    caught: done.reduce((sum, e) => sum + (e.caughtCount ?? 0), 0),
    chased: done.reduce((sum, e) => sum + (e.chasedCount ?? 0), 0),
    rescued: done.reduce((sum, e) => sum + rescuedCount(e), 0),
    dead: done.reduce((sum, e) => sum + (e.deadCount ?? 0), 0),
    areaHa: done.reduce((sum, e) => sum + effectiveAreaHa(e), 0),
  };
}

/** Kolik akcí mělo myslivce osobně přítomného a kolik ne — jen záchrana
 * srnčat, stejný základ jako `summarize`. */
export function hunterPresenceStats(events: RescueEvent[]): { present: number; absent: number } {
  const done = doneFawnEvents(events);
  return {
    present: done.filter((e) => e.hunterPresent).length,
    absent: done.filter((e) => !e.hunterPresent).length,
  };
}

export interface StatBucket {
  label: string;
  value: number;
}

/** Seskupí `events` (očekává už jen odlétané akce) podle libovolného klíče
 * a sečte `valueOf`, seřazené sestupně podle hodnoty. `keyOf` vrátí `null`,
 * když se akce do žádné skupiny nezařazuje (např. bez pilota) — taková
 * akce se do výsledku nepočítá. */
function groupBy(
  events: RescueEvent[],
  keyOf: (e: RescueEvent) => string | null,
  valueOf: (e: RescueEvent) => number,
): StatBucket[] {
  const totals = new Map<string, number>();
  for (const e of events) {
    const key = keyOf(e);
    if (key === null) continue;
    totals.set(key, (totals.get(key) ?? 0) + valueOf(e));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/** Podle pilota (volný text u akce, viz `RescueEvent.pilot`) — prázdné jméno vynecháno. */
export function byPilot(events: RescueEvent[]): StatBucket[] {
  return groupBy(
    doneFawnEvents(events),
    (e) => (e.pilot.trim() ? e.pilot.trim() : null),
    rescuedCount,
  );
}

/** Podle typu porostu — nevyplněné jde do "Neuvedeno". */
export function byCropType(events: RescueEvent[]): StatBucket[] {
  return groupBy(
    doneFawnEvents(events),
    (e) => (e.cropType ? e.cropType : "Neuvedeno") as CropType | "Neuvedeno",
    rescuedCount,
  );
}

const MONTH_NAMES = [
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

/** Seskupí `events` podle kalendářního měsíce začátku akce a sečte
 * `valueOf`, chronologicky (na rozdíl od `groupBy` NEřadíme podle
 * hodnoty — pořadí v čase je tu to podstatné). Akce s nerozpoznatelným
 * datem se přeskočí. */
function groupByMonth(events: RescueEvent[], valueOf: (e: RescueEvent) => number): StatBucket[] {
  const totals = new Map<string, number>();
  for (const e of events) {
    const d = new Date(e.startTime);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + valueOf(e));
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      return { label: `${MONTH_NAMES[Number(month) - 1]} ${year}`, value };
    });
}

/** Podle měsíce (sezónní přehled) — jen záchrana srnčat, součet zachráněných. */
export function byMonth(events: RescueEvent[]): StatBucket[] {
  return groupByMonth(doneFawnEvents(events), rescuedCount);
}

/** Počet přednášek/jiných výjezdů podle kalendářního měsíce — na rozdíl od
 * `byMonth` jde jen o počet akcí, ne o zachráněná srnčata (u nich žádná
 * nejsou). */
export function otherEventsByMonth(events: RescueEvent[]): StatBucket[] {
  return groupByMonth(doneOtherEvents(events), () => 1);
}
