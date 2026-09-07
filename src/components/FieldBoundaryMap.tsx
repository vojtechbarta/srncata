import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "../lib/lpis";

/**
 * Mapa se skutečnou hranicí pole(í) z LPIS — na rozdíl od `MapPreview`
 * (jeden špendlík z Google Maps odkazu) tahle kreslí reálný polygon nad
 * podkladem OpenStreetMap. Leaflet + OSM dlaždice, žádný API klíč.
 *
 * `markers` jsou body bez známé hranice (zadané rovnou, LPIS blok se k
 * nim nenašel) — zobrazí se jako tečka, ne polygon.
 */
export function FieldBoundaryMap({ polygons, markers = [] }: { polygons: LatLng[][]; markers?: LatLng[] }) {
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
    for (const ring of polygons) {
      const latlngs = ring.map((p): L.LatLngTuple => [p.lat, p.lng]);
      L.polygon(latlngs, { color: "#d9541f", weight: 2, fillOpacity: 0.15 }).addTo(map);
      allLatLngs.push(...latlngs);
    }
    for (const m of markers) {
      const tuple: L.LatLngTuple = [m.lat, m.lng];
      L.circleMarker(tuple, { radius: 8, color: "#d9541f", weight: 2, fillOpacity: 0.7 }).addTo(map);
      allLatLngs.push(tuple);
    }
    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [24, 24] });
    }
  }, [polygons, markers]);

  return <div ref={containerRef} className="h-64 w-full rounded-xl border border-line" />;
}
