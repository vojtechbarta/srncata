import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildMappingKmz } from "./djiWpml";

const SQUARE_POLYGON = [
  [
    { lat: 49.86, lng: 18.19 },
    { lat: 49.861, lng: 18.19 },
    { lat: 49.861, lng: 18.191 },
    { lat: 49.86, lng: 18.191 },
  ],
];

describe("buildMappingKmz", () => {
  it("vygeneruje .kmz se šablonou i wayliny podle specifikace (dva soubory ve wpmz/)", () => {
    const zip = unzipSync(buildMappingKmz({ name: "Pole", polygon: SQUARE_POLYGON }));
    expect(Object.keys(zip).sort()).toEqual(["wpmz/template.kml", "wpmz/waylines.wpml"]);
  });

  it("použije výchozí výšku 60 m a rychlost 4 m/s, když nejsou zadané", () => {
    const zip = unzipSync(buildMappingKmz({ name: "Pole", polygon: SQUARE_POLYGON }));
    const template = strFromU8(zip["wpmz/template.kml"]);
    expect(template).toContain("<wpml:globalShootHeight>60</wpml:globalShootHeight>");
    expect(template).toContain("<wpml:autoFlightSpeed>4</wpml:autoFlightSpeed>");
  });

  it("promítne zadanou výšku a rychlost letu do šablony i waylinů", () => {
    const zip = unzipSync(buildMappingKmz({ name: "Pole", polygon: SQUARE_POLYGON, heightM: 80, speedMs: 6 }));
    const template = strFromU8(zip["wpmz/template.kml"]);
    const waylines = strFromU8(zip["wpmz/waylines.wpml"]);

    expect(template).toContain("<wpml:globalShootHeight>80</wpml:globalShootHeight>");
    expect(template).toContain("<wpml:ellipsoidHeight>80</wpml:ellipsoidHeight>");
    expect(template).toContain("<wpml:autoFlightSpeed>6</wpml:autoFlightSpeed>");
    expect(waylines).toContain("<wpml:executeHeight>80</wpml:executeHeight>");
    expect(waylines).toContain("<wpml:waypointSpeed>6</wpml:waypointSpeed>");
  });

  it("kamera je napevno termovizní (IR) a gimbal kolmo dolů (-90°)", () => {
    const zip = unzipSync(buildMappingKmz({ name: "Pole", polygon: SQUARE_POLYGON }));
    const template = strFromU8(zip["wpmz/template.kml"]);
    expect(template).toContain("<wpml:imageFormat>ir</wpml:imageFormat>");
    expect(template).toContain("<wpml:gimbalPitchAngle>-90</wpml:gimbalPitchAngle>");
  });

  it("vloží obvod (hlavní obrys) pole jako souřadnice polygonu ve tvaru lng,lat", () => {
    const zip = unzipSync(buildMappingKmz({ name: "Pole", polygon: SQUARE_POLYGON }));
    const template = strFromU8(zip["wpmz/template.kml"]);
    expect(template).toContain("18.19,49.86,0");
  });
});
