import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Mapa se skutečnou hranicí pole(í) z LPIS — na rozdíl od `MapPreview`
 * (jeden špendlík z Google Maps odkazu) tahle kreslí reálný polygon nad
 * podkladem OpenStreetMap (kartografická mapa — silnice, cesty, lesy).
 * Leaflet + volně dostupné dlaždice, žádný API klíč. V rohu je přepínač
 * na letecké ortofoto ČÚZK (veřejná WMS služba, aktuální snímky ČR) —
 * hodí se na kontrolu skutečného stavu porostu, ne jen kartografie.
 *
 * Položky bez nalezené hranice se kreslí jako tečka, ne polygon.
 *
 * Bere jen podmnožinu polí z `EventFieldItem` (strukturální typování —
 * plný `EventFieldItem[]` sedí taky), ať jde poslat i minimální objekt
 * zakódovaný v URL (viz FieldMapPage — samostatná stránka s jedním
 * polem, otevíraná v novém okně).
 */
export interface MapField {
  label: string;
  lpisCode: string;
  lat: number;
  lng: number;
  polygon: { lat: number; lng: number }[][];
}

interface Props {
  fields: MapField[];
  /** Pořadové číslo prvního z `fields` (pro popisek) — užitečné, když se
   * mapa kreslí jen pro jednu položku ze seznamu, ale číslo má sedět na
   * její skutečnou pozici. */
  startIndex?: number;
  /** "number": jen pořadové číslo (souhrnná mapa víc polí) — "none": žádný
   * popisek (malá mapa u jedné položky, kde zabírá zbytečně místo). */
  captionMode?: "number" | "none";
  /** Přepínač Mapa/Letecká — na hodně malé mapě (pár desítek px) se
   * rozbalený seznam vrstev nevejde a Leaflet ho ořízne, tak ho tam radši
   * vůbec nenabízet (na malé mapě u položky je i tak odkaz "Otevřít mapu
   * v novém okně" na plnohodnotnou mapu s přepínačem). */
  showLayerSwitcher?: boolean;
  className?: string;
}

export function FieldBoundaryMap({
  fields,
  startIndex = 0,
  captionMode = "number",
  showLayerSwitcher = true,
  className = "h-64 w-full rounded-xl border border-line",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;

    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    if (showLayerSwitcher) {
      const orthoLayer = L.tileLayer.wms("https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", {
        layers: "0",
        format: "image/jpeg",
        version: "1.3.0",
        maxZoom: 19,
        attribution: "&copy; ČÚZK",
      });
      L.control
        .layers({ Mapa: streetLayer, "Letecká (ČÚZK)": orthoLayer }, undefined, { position: "topleft" })
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [showLayerSwitcher]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const allLatLngs: L.LatLngTuple[] = [];
    fields.forEach((field, index) => {
      const caption = `${startIndex + index + 1}.`;

      if (field.polygon.length > 0) {
        for (const ring of field.polygon) {
          const latlngs = ring.map((p): L.LatLngTuple => [p.lat, p.lng]);
          const layer = L.polygon(latlngs, { color: "#d9541f", weight: 2, fillOpacity: 0.15 }).addTo(map);
          if (captionMode === "number") {
            layer.bindTooltip(caption, { permanent: true, direction: "center", className: "field-map-label" });
          }
          allLatLngs.push(...latlngs);
        }
      } else {
        const tuple: L.LatLngTuple = [field.lat, field.lng];
        const layer = L.circleMarker(tuple, { radius: 8, color: "#d9541f", weight: 2, fillOpacity: 0.7 }).addTo(
          map,
        );
        if (captionMode === "number") {
          layer.bindTooltip(caption, { permanent: true, direction: "top", className: "field-map-label" });
        }
        allLatLngs.push(tuple);
      }
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [24, 24] });
    }
  }, [fields, startIndex, captionMode]);

  return <div ref={containerRef} className={className} />;
}
