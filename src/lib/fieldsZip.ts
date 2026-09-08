// Hromadný export všech polí akce do jednoho .zip — pro případy, kdy se
// nechce stahovat KMZ/GPX pole po poli. Obsahuje pro každé pole GPX
// (vždy — funguje i pro samotný bod bez dohledané hranice) a k tomu KMZ
// pro DJI Pilot 2 tam, kde hranici známe (viz djiWpml.ts).
import { strToU8, zipSync } from "fflate";
import type { EventFieldItem } from "./types";
import { buildMappingKmz } from "./djiWpml";
import { buildFieldGpx } from "./gpx";
import { safeFileName } from "./fieldGeo";

export interface FieldsZipOptions {
  eventName: string;
  fields: EventFieldItem[];
  heightM?: number;
  speedMs?: number;
}

export function downloadFieldsZip(options: FieldsZipOptions): void {
  const files: Record<string, Uint8Array> = {};

  options.fields.forEach((f, index) => {
    const label = f.label || f.lpisCode || `pole-${index + 1}`;
    const prefix = `${String(index + 1).padStart(2, "0")}-${safeFileName(label)}`;

    files[`${prefix}.gpx`] = strToU8(
      buildFieldGpx({ name: label, lat: f.lat, lng: f.lng, polygon: f.polygon }),
    );

    if (f.polygon.length > 0) {
      files[`${prefix}.kmz`] = buildMappingKmz({
        name: label,
        polygon: f.polygon,
        heightM: options.heightM,
        speedMs: options.speedMs,
      });
    }
  });

  if (Object.keys(files).length === 0) return;

  const zipped = zipSync(files);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(options.eventName)}-pole.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
