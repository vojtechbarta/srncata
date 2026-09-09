import { describe, expect, it } from "vitest";
import { buildFieldGpx } from "./gpx";

describe("buildFieldGpx", () => {
  it("pole se známou hranicí exportuje jako track (trk) s obvodem", () => {
    const gpx = buildFieldGpx({
      name: "Horní louka",
      lat: 49.86,
      lng: 18.19,
      polygon: [
        [
          { lat: 49.86, lng: 18.19 },
          { lat: 49.861, lng: 18.191 },
          { lat: 49.862, lng: 18.192 },
        ],
      ],
    });

    expect(gpx).toContain("<trk>");
    expect(gpx).toContain("<name>Horní louka</name>");
    expect(gpx).toContain('<trkpt lat="49.86" lon="18.19" />');
    expect(gpx).toContain('<trkpt lat="49.862" lon="18.192" />');
    expect(gpx).not.toContain("<wpt");
  });

  it("bod bez dohledané hranice exportuje jako jediný waypoint", () => {
    const gpx = buildFieldGpx({ name: "Jen bod", lat: 49.86, lng: 18.19, polygon: [] });

    expect(gpx).toContain('<wpt lat="49.86" lon="18.19">');
    expect(gpx).toContain("<name>Jen bod</name>");
    expect(gpx).not.toContain("<trk>");
  });

  it("escapuje speciální znaky v názvu", () => {
    const gpx = buildFieldGpx({ name: 'Pole "U & Syna" <test>', lat: 0, lng: 0, polygon: [] });
    expect(gpx).toContain("Pole &quot;U &amp; Syna&quot; &lt;test&gt;");
  });

  it("prázdný název dostane záložní 'pole'", () => {
    const gpx = buildFieldGpx({ name: "", lat: 0, lng: 0, polygon: [] });
    expect(gpx).toContain("<name>pole</name>");
  });

  it("je platný XML dokument s GPX 1.1 hlavičkou", () => {
    const gpx = buildFieldGpx({ name: "x", lat: 0, lng: 0, polygon: [] });
    expect(gpx).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(gpx).toContain('<gpx version="1.1"');
  });
});
