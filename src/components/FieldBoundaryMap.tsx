import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Mapa se skutečnou hranicí pole(í) z LPIS — na rozdíl od `MapPreview`
 * (jeden špendlík z Google Maps odkazu) tahle kreslí reálný polygon nad
 * podkladem OpenStreetMap. Leaflet + OSM dlaždice, žádný API klíč.
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
  className?: string;
}

export function FieldBoundaryMap({
  fields,
  startIndex = 0,
  captionMode = "number",
  className = "h-64 w-full rounded-xl border border-line",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
