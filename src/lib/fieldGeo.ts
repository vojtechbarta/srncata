// Sdílené drobnosti pro export hranic polí (KMZ pro DJI, GPX, souhrnný ZIP)
// — ať se stejná logika nepíše na třech místech zvlášť.

export interface LatLng {
  lat: number;
  lng: number;
}

/** Bere největší z vnějších obrysů bloku — u drtivé většiny polí je jen
 * jeden, u výjimečných vícedílných bloků tak exportujeme aspoň hlavní část. */
export function mainRing(polygon: LatLng[][]): LatLng[] {
  return polygon.reduce((best, ring) => (ring.length > best.length ? ring : best), polygon[0] ?? []);
}

/** Bezpečný název souboru z libovolného textu (diakritika/mezery/lomítka pryč). */
export function safeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "pole";
}
