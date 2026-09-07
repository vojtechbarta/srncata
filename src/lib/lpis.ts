// Propojení s veřejným registrem půdy LPIS — ve dvou směrech:
//  - podle čísla půdního bloku (např. "0701/1") dohledat jeho hranici a
//    souřadnice (`findLpisBlocks`) — zemědělec často pošle rovnou číslo
//  - podle bodu na mapě (např. z Google Maps odkazu) dohledat, do kterého
//    bloku ten bod spadá (`findLpisBlockAtPoint`) — jindy má appka jen
//    souřadnice od zemědělce/myslivce a chceme z nich dopočítat hranici
//
// Používá veřejné WFS API Ministerstva zemědělství (otevřené CORS, bez
// potřeby API klíče), viz https://mze.gov.cz/public/portal/mze/farmar/LPIS.
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
  ownerAddress: string; // adresaUzivatele — LPIS nemá veřejně telefon/e-mail, jen adresu
  district: string; // uzemniPrislusnost
  culture: string; // kultura (orná půda, TTP, úhor…)
  areaHa: number | null; // vymera v hektarech
  lat: number; // těžiště (průměr vrcholů) — pro špendlík na mapě
  lng: number;
  polygon: LatLng[][]; // vnější obrysy bloku (většinou jeden, výjimečně víc oddělených částí)
  distanceKm: number | null; // vzdálenost od referenčního bodu, null když bez reference
}

/** Vzdálenost dvou bodů po zemském povrchu (haversine), v kilometrech. */
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Je bod uvnitř polygonu (ray casting)? Bere v potaz jen vnější obrysy. */
export function pointInPolygon(point: LatLng, polygon: LatLng[][]): boolean {
  return polygon.some((ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      const crosses =
        a.lat > point.lat !== b.lat > point.lat &&
        point.lng < ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
      if (crosses) inside = !inside;
    }
    return inside;
  });
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
    ownerAddress: textOf(el, "ms:adresaUzivatele"),
    district: textOf(el, "ms:uzemniPrislusnost"),
    culture: textOf(el, "ms:kultura"),
    areaHa: Number.isFinite(areaHa) ? areaHa : null,
    lat: sumLat / count,
    lng: sumLng / count,
    polygon,
    distanceKm: null,
  };
}

async function queryWfs(extraParams: Record<string, string>): Promise<LpisMatch[]> {
  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: "1.1.0",
    REQUEST: "GetFeature",
    TYPENAME: "LPIS_DPB_UCINNE",
    SRSNAME: "EPSG:4326",
    ...extraParams,
  });

  const res = await fetch(`${WFS_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Nepodařilo se spojit s registrem LPIS.");

  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("LPIS vrátil neočekávanou odpověď.");
  }

  const features = Array.from(doc.getElementsByTagName("ms:LPIS_DPB_UCINNE"));
  return features.map(parseFeature).filter((f): f is LpisMatch => f !== null);
}

/**
 * Najde účinné díly půdního bloku podle čísla (např. "0701/1", nebo
 * rovnou s čtvercem "0701/1 480-1090" pro jednoznačný výsledek) —
 * omezeno na Moravskoslezský kraj. Když je zadaný `near` (např. už
 * vyplněný bod), výsledky se seřadí od nejbližšího — u stejného čísla
 * bloku ve víc okresech tak bývá ta pravá položka hned první.
 */
export async function findLpisBlocks(code: string, near?: LatLng | null): Promise<LpisMatch[]> {
  const trimmed = code.trim();
  if (!trimmed) return [];

  // Když je zadaný i čtverec (obsahuje mezeru), je kodCtverec už sám o
  // sobě jednoznačný; jinak hledáme jen podle kratšího zkracenyKod.
  const property = trimmed.includes(" ") ? "kodCtverec" : "zkracenyKod";
  const filter = `<Filter xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo><PropertyName>${property}</PropertyName><Literal>${escapeXml(trimmed)}</Literal></PropertyIsEqualTo></Filter>`;

  const parsed = await queryWfs({ FILTER: filter });
  const inMsk = parsed.filter((f) => f.district.endsWith(MSK_SUFFIX));

  if (!near) return inMsk;

  const withDistance = inMsk.map((f) => ({ ...f, distanceKm: distanceKm(near, { lat: f.lat, lng: f.lng }) }));
  withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return withDistance;
}

/**
 * Opačný směr: podle bodu (typicky vytáhnutého z Google Maps odkazu)
 * najde půdní blok, do kterého bod spadá — vezme malé okolí bodu a z
 * vrácených bloků vybere ten, co bod fakticky obsahuje (point-in-polygon).
 * Vrátí `null`, když bod nespadá do žádného evidovaného bloku (např. les,
 * zástavba, nebo mezera v datech) — pak se dá pracovat aspoň se samotným
 * bodem bez hranice.
 */
export async function findLpisBlockAtPoint(point: LatLng): Promise<LpisMatch | null> {
  const delta = 0.003; // ~300 m — s rezervou na i větší souvislé bloky
  const bbox = [point.lat - delta, point.lng - delta, point.lat + delta, point.lng + delta].join(",");
  const candidates = await queryWfs({ BBOX: `${bbox},EPSG:4326` });
  const containing = candidates.find((f) => pointInPolygon(point, f.polygon));
  return containing ?? null;
}
