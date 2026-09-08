// Export hranice/bodu pole jako GPX — na rozdíl od KMZ (viz djiWpml.ts,
// specifické pro DJI Pilot 2) je GPX univerzální formát, který otevře
// prakticky jakákoli navigační appka nebo GPS přijímač, i mimo DJI
// ekosystém (jiná značka dronu, mobil, ruční GPS na zemi).
import { mainRing, safeFileName, type LatLng } from "./fieldGeo";

export interface FieldGpxOptions {
  name: string;
  lat: number;
  lng: number;
  polygon: LatLng[][];
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Pole s dohledanou hranicí -> track (obvod), bez hranice -> jeden waypoint. */
export function buildFieldGpx(options: FieldGpxOptions): string {
  const name = escapeXml(options.name || "pole");
  const ring = mainRing(options.polygon);

  const body =
    ring.length > 0
      ? `  <trk>
    <name>${name}</name>
    <trkseg>
${ring.map((p) => `      <trkpt lat="${p.lat}" lon="${p.lng}" />`).join("\n")}
    </trkseg>
  </trk>`
      : `  <wpt lat="${options.lat}" lon="${options.lng}">
    <name>${name}</name>
  </wpt>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Zachrana srncat MSK" xmlns="http://www.topografix.com/GPX/1/1">
${body}
</gpx>
`;
}

/** Vygeneruje .gpx a rovnou spustí stažení v prohlížeči. */
export function downloadFieldGpx(options: FieldGpxOptions): void {
  const gpx = buildFieldGpx(options);
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(options.name)}.gpx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
