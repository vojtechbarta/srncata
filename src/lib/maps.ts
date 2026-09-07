// Vytáhne souřadnice z různých tvarů Google Maps odkazů, aby šlo pod
// políčko "Odkaz na Google Maps" zobrazit i mapový náhled — bez API klíče
// (viz komponenta MapPreview).
const PATTERNS = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // přesná poloha špendlíku v plné URL adrese
  /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ...?q=49.86,18.19
  /@(-?\d+\.\d+),(-?\d+\.\d+)/, // střed výřezu z /maps/place/.../@49.86,18.19,17z
  /\/maps\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/, // /maps/search/49.86,+18.19 (po rozbalení zkráceného odkazu)
  /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/, // rovnou vložené "49.86, 18.19"
];

export function extractLatLng(value: string): { lat: number; lng: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { lat: Number(match[1]), lng: Number(match[2]) };
    }
  }
  return null;
}
