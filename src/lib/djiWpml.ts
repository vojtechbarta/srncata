// Export hranice pole jako DJI WPML (.kmz) — pilot pak hranici pole
// nemusí ručně vyklikávat v ovladači: naimportuje tenhle soubor do DJI
// Pilot 2 (šablona typu "mapping2d" — plošné mapování/oblet), appka mu
// rovnou předvyplní obrys pole a z něj sama dopočítá letový plán (mřížku
// letu, podle překrytí a výšky). Výška a rychlost jsou nastavitelné (viz
// EventFieldsEditor); kamera je napevno termovizní (IR) a gimbal napevno
// kolmo dolů (nadir, -90°) — přesně jak se létá při hledání srnčat.
//
// Formát: DJI WPML v1.0.2, viz oficiální dokumentace
// https://developer.dji.com/doc/cloud-api-tutorial/en/api-reference/dji-wpml/ .
// Sestaveno přesně podle publikovaného schématu šablony "mapping2d", ale
// NEOVĚŘENO na reálném hardwaru (Matrice 4T) — než na export spolehnete
// při ostré akci, první soubor si jen naimportujte do DJI Pilot 2 a
// zkontrolujte, že se hranice a letový plán zobrazí správně.
import { strToU8, zipSync } from "fflate";

interface LatLng {
  lat: number;
  lng: number;
}

export interface MappingExportOptions {
  name: string;
  polygon: LatLng[][];
  /** Výška letu nad zemí v metrech — výchozí 60, v DJI Pilot 2 se dá před letem upravit. */
  heightM?: number;
  /** Rychlost letu v m/s — výchozí 4, v DJI Pilot 2 se dá před letem upravit. */
  speedMs?: number;
}

type ResolvedOptions = Required<MappingExportOptions>;

function resolveOptions(options: MappingExportOptions): ResolvedOptions {
  return { heightM: 60, speedMs: 4, ...options };
}

/** Bere největší z vnějších obrysů bloku — u drtivé většiny polí je jen
 * jeden, u výjimečných vícedílných bloků tak exportujeme aspoň hlavní část. */
function mainRing(polygon: LatLng[][]): LatLng[] {
  return polygon.reduce((best, ring) => (ring.length > best.length ? ring : best), polygon[0] ?? []);
}

function buildTemplateKml(opts: ResolvedOptions): string {
  const ring = mainRing(opts.polygon);
  const coords = ring.map((p) => `            ${p.lng},${p.lat},0`).join("\n");
  const now = Date.now();

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
<Document>
  <wpml:author>Zachrana srncat MSK</wpml:author>
  <wpml:createTime>${now}</wpml:createTime>
  <wpml:updateTime>${now}</wpml:updateTime>
  <wpml:missionConfig>
    <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
    <wpml:finishAction>goHome</wpml:finishAction>
    <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
    <wpml:executeRCLostAction>hover</wpml:executeRCLostAction>
    <wpml:takeOffSecurityHeight>20</wpml:takeOffSecurityHeight>
    <wpml:globalTransitionalSpeed>${opts.speedMs}</wpml:globalTransitionalSpeed>
  </wpml:missionConfig>
  <Folder>
    <wpml:templateType>mapping2d</wpml:templateType>
    <wpml:templateId>0</wpml:templateId>
    <wpml:waylineCoordinateSysParam>
      <wpml:coordinateMode>WGS84</wpml:coordinateMode>
      <wpml:heightMode>relativeToStartPoint</wpml:heightMode>
      <wpml:globalShootHeight>${opts.heightM}</wpml:globalShootHeight>
      <wpml:surfaceFollowModeEnable>0</wpml:surfaceFollowModeEnable>
    </wpml:waylineCoordinateSysParam>
    <wpml:autoFlightSpeed>${opts.speedMs}</wpml:autoFlightSpeed>
    <wpml:payloadParam>
      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
      <!-- Termovizní (IR) kamera — hledání srnčat, ne fotogrammetrie. -->
      <wpml:imageFormat>ir</wpml:imageFormat>
    </wpml:payloadParam>
    <Placemark>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
${coords}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
      <wpml:caliFlightEnable>0</wpml:caliFlightEnable>
      <wpml:elevationOptimizeEnable>0</wpml:elevationOptimizeEnable>
      <wpml:shootType>time</wpml:shootType>
      <wpml:direction>0</wpml:direction>
      <wpml:margin>0</wpml:margin>
      <wpml:overlap>
        <wpml:orthoCameraOverlapH>70</wpml:orthoCameraOverlapH>
        <wpml:orthoCameraOverlapW>60</wpml:orthoCameraOverlapW>
      </wpml:overlap>
      <wpml:ellipsoidHeight>${opts.heightM}</wpml:ellipsoidHeight>
      <wpml:height>${opts.heightM}</wpml:height>
      <!-- Kamera napevno kolmo dolů (nadir) — hledání srnčat pod dronem. -->
      <wpml:gimbalPitchMode>fixed</wpml:gimbalPitchMode>
      <wpml:gimbalPitchAngle>-90</wpml:gimbalPitchAngle>
    </Placemark>
  </Folder>
</Document>
</kml>
`;
}

// Placeholder "waylines.wpml" — jen prostě obchází obvod pole. DJI Pilot 2
// si při importu šablony typu mapping2d skutečnou mřížku letu dopočítá
// sám (viz komentář nahoře); tenhle soubor je tu jen proto, že .kmz podle
// specifikace musí obsahovat oba soubory, aby ho appka vůbec načetla.
function buildWaylinesWpml(opts: ResolvedOptions): string {
  const ring = mainRing(opts.polygon);

  const placemarks = ring
    .map(
      (p, i) => `      <Placemark>
        <Point>
          <coordinates>${p.lng},${p.lat}</coordinates>
        </Point>
        <wpml:index>${i}</wpml:index>
        <wpml:executeHeight>${opts.heightM}</wpml:executeHeight>
        <wpml:waypointSpeed>${opts.speedMs}</wpml:waypointSpeed>
        <wpml:waypointHeadingParam>
          <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>
        </wpml:waypointHeadingParam>
        <wpml:waypointTurnParam>
          <wpml:waypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:waypointTurnMode>
          <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
        </wpml:waypointTurnParam>
      </Placemark>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>goHome</wpml:finishAction>
      <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>hover</wpml:executeRCLostAction>
      <wpml:takeOffSecurityHeight>20</wpml:takeOffSecurityHeight>
      <wpml:globalTransitionalSpeed>${opts.speedMs}</wpml:globalTransitionalSpeed>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateId>0</wpml:templateId>
      <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>
      <wpml:waylineId>0</wpml:waylineId>
      <wpml:autoFlightSpeed>${opts.speedMs}</wpml:autoFlightSpeed>
${placemarks}
    </Folder>
  </Document>
</kml>
`;
}

export function buildMappingKmz(options: MappingExportOptions): Uint8Array {
  const opts = resolveOptions(options);
  return zipSync({
    "wpmz/template.kml": strToU8(buildTemplateKml(opts)),
    "wpmz/waylines.wpml": strToU8(buildWaylinesWpml(opts)),
  });
}

/** Vygeneruje .kmz a rovnou spustí stažení v prohlížeči. */
export function downloadMappingKmz(options: MappingExportOptions): void {
  const zipped = buildMappingKmz(options);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: "application/vnd.google-earth.kmz" });
  const url = URL.createObjectURL(blob);
  const safeName = options.name.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "pole";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.kmz`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
