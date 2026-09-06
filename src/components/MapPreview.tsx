import { extractLatLng } from "../lib/maps";

/**
 * Malý náhled mapy pod odkazem na Google Maps. Bez API klíče — použitý
 * `output=embed` funguje jen tehdy, když z odkazu jdou vytáhnout souřadnice
 * (viz `extractLatLng`); u odkazů, kde to nejde (např. zkrácené
 * maps.app.goo.gl), se nic nezobrazí a zůstává jen samotný odkaz.
 */
export function MapPreview({ mapsLink }: { mapsLink: string }) {
  if (!mapsLink) return null;
  const coords = extractLatLng(mapsLink);
  if (!coords) return null;

  const src = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-line">
      <iframe
        src={src}
        title="Náhled místa na mapě"
        loading="lazy"
        className="h-full w-full grayscale-0"
        style={{ border: 0 }}
      />
      <a
        href={mapsLink}
        target="_blank"
        rel="noreferrer"
        className="absolute right-2 top-2 rounded-full bg-bg-raised/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow)] backdrop-blur-sm hover:opacity-90"
      >
        Otevřít v Google Maps ↗
      </a>
    </div>
  );
}
