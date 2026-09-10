// Vytáhne souřadnice z různých tvarů Google Maps odkazů, aby šlo pod
// políčko "Odkaz na Google Maps" zobrazit i mapový náhled — bez API klíče
// (viz komponenta MapPreview).
const PATTERNS = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // přesná poloha špendlíku v plné URL adrese
  /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ...?q=49.86,18.19
  /@(-?\d+\.\d+),(-?\d+\.\d+)/, // střed výřezu z /maps/place/.../@49.86,18.19,17z
  /\/maps\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/, // /maps/search/49.86,+18.19 (po rozbalení zkráceného odkazu)
  /\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/, // v závorce — Google Maps na mobilu při sdílení polohy často přidá text v tvaru "Název místa (49.8191212, 18.1301122)"
  /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/, // rovnou vložené "49.86, 18.19"
];

/** Je to zeměpisně vůbec možná souřadnice? Vzorce výše umí vytáhnout
 *  jakákoli dvě desetinná čísla ve správném tvaru — u poškozeného nebo
 *  pozměněného odkazu by appka jinak "úspěšně" našla nesmyslné číslo
 *  mimo platný rozsah místo toho, aby náhled mapy rovnou schovala. */
function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function extractLatLng(value: string): { lat: number; lng: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      return isValidLatLng(lat, lng) ? { lat, lng } : null;
    }
  }
  return null;
}
