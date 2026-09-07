// Vyhledání dílu půdního bloku (DPB) ve veřejném registru půdy LPIS podle
// čísla, které zemědělci často posílají přímo (např. "0701/1") — ať ho
// nemusíme ručně dohledávat na mapě. Používá veřejné WFS API Ministerstva
// zemědělství (otevřené CORS, bez potřeby API klíče), viz
// https://mze.gov.cz/public/portal/mze/farmar/LPIS.
//
// Číslo bloku samo o sobě NENÍ celostátně jedinečné — stejné číslo se
// opakuje v různých "čtvercích" po celé ČR (běžné číslo najde klidně přes
// 400 shod). Proto výsledky omezujeme na bloky spadající pod územní
// pracoviště pro Moravskoslezský kraj — v datech poznat podle přípony
// "(OP)" u pole uzemniPrislusnost (Opava/Frýdek-Místek/Nový Jičín/
// Bruntál/Ostrava/Karviná spadají pod stejné pracoviště) — spolek mimo
// tenhle kraj nepůsobí, takže i tak zůstane výsledků jen pár.
const WFS_URL = "https://mze.gov.cz/public/app/wms/plpis_wfs.fcgi";
const MSK_SUFFIX = "(OP)";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LpisMatch {
  id: string;
  code: string; // zkracenyKod, např. "0701/1"
  fullCode: string; // kodCtverec, např. "0701/1 480-1090" — jednoznačné
  owner: string; // uzivatel (název zemědělce/farmy)
  district: string; // uzemniPrislusnost
  culture: string; // kultura (orná půda, TTP, úhor…)
  areaHa: number | null; // vymera v hektarech
  lat: number; // těžiště (průměr vrcholů) — pro špendlík na mapě
  lng: number;
  polygon: LatLng[][]; // vnější obrysy bloku (většinou jeden, výjimečně víc oddělených částí)
  distanceKm: number | null; // vzdálenost od referenčního bodu (viz findLpisBlocks), null když bez reference
}

/** Vzdálenost dvou bodů po zemském povrchu (haversine), v kilometrech. */
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textOf(el: Element, tag: string): string {
  return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function parseFeature(el: Element): LpisMatch | null {
  const geometryEl = el.getElementsByTagName("ms:GEOMETRY")[0];
  if (!geometryEl) return null;

  // Vytáhneme vnější obrysy (bez děr uvnitř polygonu — pro zobrazení
  // hranice pole je nepotřebujeme) a z jejich vrcholů spočítáme těžiště
  // (prostý průměr — pro umístění špendlíku na mapě to bohatě stačí,
  // přesné geometrické těžiště nepotřebujeme).
  const polygon: LatLng[][] = [];
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  for (const ring of Array.from(geometryEl.getElementsByTagName("gml:exterior"))) {
    const posList = ring.getElementsByTagName("gml:posList")[0]?.textContent?.trim();
    if (!posList) continue;
    const nums = posList.split(/\s+/).map(Number);
    const points: LatLng[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lat = nums[i];
      const lng = nums[i + 1];
      points.push({ lat, lng });
      sumLat += lat;
      sumLng += lng;
      count++;
    }
    if (points.length > 0) polygon.push(points);
  }
  if (count === 0) return null;

  const areaRaw = textOf(el, "ms:vymera").replace(",", ".");
  const areaHa = areaRaw ? Number(areaRaw) : NaN;

  return {
    id: el.getAttribute("gml:id") ?? `${sumLat}-${sumLng}`,
    code: textOf(el, "ms:zkracenyKod"),
    fullCode: textOf(el, "ms:kodCtverec"),
    owner: textOf(el, "ms:uzivatel"),
    district: textOf(el, "ms:uzemniPrislusnost"),
    culture: textOf(el, "ms:kultura"),
    areaHa: Number.isFinite(areaHa) ? areaHa : null,
    lat: sumLat / count,
    lng: sumLng / count,
    polygon,
    distanceKm: null,
  };
}

/**
 * Najde účinné díly půdního bloku podle čísla (např. "0701/1", nebo
 * rovnou s čtvercem "0701/1 480-1090" pro jednoznačný výsledek) —
 * omezeno na Moravskoslezský kraj. Když je zadaný `near` (např. už
 * vyplněný orientační bod v poli "Odkaz na Google Maps"), výsledky se
 * seřadí od nejbližšího — u stejného čísla bloku ve víc okresech tak
 * bývá ta pravá položka hned první.
 */
export async function findLpisBlocks(code: string, near?: LatLng | null): Promise<LpisMatch[]> {
  const trimmed = code.trim();
  if (!trimmed) return [];

  // Když je zadaný i čtverec (obsahuje mezeru), je kodCtverec už sám o
  // sobě jednoznačný; jinak hledáme jen podle kratšího zkracenyKod.
  const property = trimmed.includes(" ") ? "kodCtverec" : "zkracenyKod";
  const filter = `<Filter xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo><PropertyName>${property}</PropertyName><Literal>${escapeXml(trimmed)}</Literal></PropertyIsEqualTo></Filter>`;

  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: "1.1.0",
    REQUEST: "GetFeature",
    TYPENAME: "LPIS_DPB_UCINNE",
    SRSNAME: "EPSG:4326",
    FILTER: filter,
  });

  const res = await fetch(`${WFS_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Nepodařilo se spojit s registrem LPIS.");

  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("LPIS vrátil neočekávanou odpověď.");
  }

  const features = Array.from(doc.getElementsByTagName("ms:LPIS_DPB_UCINNE"));
  const parsed = features.map(parseFeature).filter((f): f is LpisMatch => f !== null);
  const inMsk = parsed.filter((f) => f.district.endsWith(MSK_SUFFIX));

  if (!near) return inMsk;

  const withDistance = inMsk.map((f) => ({ ...f, distanceKm: distanceKm(near, { lat: f.lat, lng: f.lng }) }));
  withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return withDistance;
}
