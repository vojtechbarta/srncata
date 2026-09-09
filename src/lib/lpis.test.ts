import { afterEach, describe, expect, it, vi } from "vitest";
import { findLpisBlockAtPoint, findLpisBlocks, pointInPolygon, type LatLng } from "./lpis";

describe("pointInPolygon", () => {
  const square: LatLng[][] = [
    [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 },
    ],
  ];

  it("bod uvnitř obrysu je uvnitř", () => {
    expect(pointInPolygon({ lat: 5, lng: 5 }, square)).toBe(true);
  });

  it("bod mimo obrys je mimo", () => {
    expect(pointInPolygon({ lat: 50, lng: 50 }, square)).toBe(false);
  });

  it("bod bere v potaz jen vnější obrysy — druhý (oddělený) díl bloku funguje taky", () => {
    const twoParts: LatLng[][] = [
      square[0],
      [
        { lat: 20, lng: 20 },
        { lat: 20, lng: 30 },
        { lat: 30, lng: 30 },
        { lat: 30, lng: 20 },
      ],
    ];
    expect(pointInPolygon({ lat: 25, lng: 25 }, twoParts)).toBe(true);
    expect(pointInPolygon({ lat: 15, lng: 15 }, twoParts)).toBe(false);
  });

  it("prázdný polygon nic neobsahuje", () => {
    expect(pointInPolygon({ lat: 5, lng: 5 }, [])).toBe(false);
  });
});

// Zjednodušená WFS odpověď ve stejném tvaru, jaký appka doopravdy dostává
// od mze.gov.cz (ověřeno ruční kontrolou reálné odpovědi) — jedno
// <gml:featureMember> na blok, GEOMETRY jako jeden vnější obrys.
function featureXml(opts: {
  id: string;
  zkracenyKod: string;
  kodCtverec: string;
  district: string;
  center: LatLng;
  vymera?: string;
}): string {
  const { id, zkracenyKod, kodCtverec, district, center, vymera = "1.23" } = opts;
  // Malý trojúhelník okolo středu — parseFeature počítá těžiště jako
  // prostý průměr vrcholů, se třemi symetrickými vrcholy vyjde přesně na
  // `center`.
  const d = 0.001;
  const posList = [
    `${center.lat - d} ${center.lng}`,
    `${center.lat + d} ${center.lng - d}`,
    `${center.lat + d} ${center.lng + d}`,
  ].join(" ");

  return `<gml:featureMember>
    <ms:LPIS_DPB_UCINNE gml:id="${id}">
      <ms:GEOMETRY>
        <gml:Polygon srsName="EPSG:4326">
          <gml:exterior>
            <gml:LinearRing>
              <gml:posList srsDimension="2">${posList}</gml:posList>
            </gml:LinearRing>
          </gml:exterior>
        </gml:Polygon>
      </ms:GEOMETRY>
      <ms:zkracenyKod>${zkracenyKod}</ms:zkracenyKod>
      <ms:kodCtverec>${kodCtverec}</ms:kodCtverec>
      <ms:uzivatel>Zemědělec s.r.o.</ms:uzivatel>
      <ms:adresaUzivatele>Obec,Ulice,č.p.1,73500</ms:adresaUzivatele>
      <ms:uzemniPrislusnost>${district}</ms:uzemniPrislusnost>
      <ms:kultura>orná půda</ms:kultura>
      <ms:vymera>${vymera}</ms:vymera>
    </ms:LPIS_DPB_UCINNE>
  </gml:featureMember>`;
}

function featureCollection(features: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection
   xmlns:ms="http://mapserver.gis.umn.edu/mapserver"
   xmlns:gml="http://www.opengis.net/gml"
   xmlns:wfs="http://www.opengis.net/wfs">
  ${features.join("\n")}
</wfs:FeatureCollection>`;
}

function mockFetchOnce(xml: string) {
  const fetchMock = vi.fn(async (_url: string) => ({ ok: true, text: async () => xml }) as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findLpisBlocks", () => {
  it("nevolá WFS pro prázdné číslo bloku", async () => {
    const fetchMock = mockFetchOnce(featureCollection([]));
    expect(await findLpisBlocks("")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("vrátí jen bloky z Moravskoslezského kraje (přípona '(OP)')", async () => {
    mockFetchOnce(
      featureCollection([
        featureXml({
          id: "a",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 480-1090",
          district: "Ostrava (OP)",
          center: { lat: 49.8, lng: 18.1 },
        }),
        featureXml({
          id: "b",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 111-2222",
          district: "Č. Krumlov (CB)",
          center: { lat: 48.8, lng: 14.3 },
        }),
      ]),
    );

    const matches = await findLpisBlocks("0701/1");
    expect(matches).toHaveLength(1);
    expect(matches[0].district).toBe("Ostrava (OP)");
    expect(matches[0].distanceKm).toBeNull();
  });

  it("bez referenčního bodu nechá pořadí beze změny (netřídí)", async () => {
    mockFetchOnce(
      featureCollection([
        featureXml({
          id: "far",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 111",
          district: "Opava (OP)",
          center: { lat: 49.9, lng: 18.3 },
        }),
        featureXml({
          id: "near",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 222",
          district: "Opava (OP)",
          center: { lat: 49.81, lng: 18.11 },
        }),
      ]),
    );

    const matches = await findLpisBlocks("0701/1");
    expect(matches.map((m) => m.id)).toEqual(["far", "near"]);
  });

  it("s referenčním bodem seřadí od nejbližšího a doplní vzdálenost", async () => {
    mockFetchOnce(
      featureCollection([
        featureXml({
          id: "far",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 111",
          district: "Opava (OP)",
          center: { lat: 49.9, lng: 18.3 },
        }),
        featureXml({
          id: "near",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 222",
          district: "Opava (OP)",
          center: { lat: 49.81, lng: 18.11 },
        }),
      ]),
    );

    const matches = await findLpisBlocks("0701/1", { lat: 49.8, lng: 18.1 });
    expect(matches.map((m) => m.id)).toEqual(["near", "far"]);
    expect(matches[0].distanceKm).not.toBeNull();
    expect(matches[0].distanceKm!).toBeLessThan(matches[1].distanceKm!);
  });

  it("u čísla se čtvercem (obsahuje mezeru) hledá podle jednoznačného kodCtverec", async () => {
    const fetchMock = mockFetchOnce(featureCollection([]));
    await findLpisBlocks("0701/1 480-1090");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(decodeURIComponent(url)).toContain("<PropertyName>kodCtverec</PropertyName>");
  });

  it("u čísla bez mezery hledá podle kratšího zkracenyKod", async () => {
    const fetchMock = mockFetchOnce(featureCollection([]));
    await findLpisBlocks("0701/1");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(decodeURIComponent(url)).toContain("<PropertyName>zkracenyKod</PropertyName>");
  });
});

describe("findLpisBlockAtPoint", () => {
  it("najde blok, do kterého bod skutečně spadá (point-in-polygon, ne jen nejbližší těžiště)", async () => {
    mockFetchOnce(
      featureCollection([
        featureXml({
          id: "containing",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 480-1090",
          district: "Ostrava (OP)",
          center: { lat: 49.8, lng: 18.1 },
        }),
      ]),
    );

    const match = await findLpisBlockAtPoint({ lat: 49.8, lng: 18.1 });
    expect(match?.id).toBe("containing");
  });

  it("vrátí null, když bod nespadá do žádného vráceného bloku (les, zástavba…)", async () => {
    mockFetchOnce(
      featureCollection([
        featureXml({
          id: "elsewhere",
          zkracenyKod: "0701/1",
          kodCtverec: "0701/1 480-1090",
          district: "Ostrava (OP)",
          center: { lat: 49.8, lng: 18.1 },
        }),
      ]),
    );

    // Bod hodně mimo malý trojúhelník okolo (49.8, 18.1).
    const match = await findLpisBlockAtPoint({ lat: 45, lng: 10 });
    expect(match).toBeNull();
  });
});
