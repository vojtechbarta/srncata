import { describe, expect, it } from "vitest";
import { extractLatLng } from "./maps";

describe("extractLatLng", () => {
  it("vytáhne souřadnice z přesné polohy špendlíku (!3d!4d) v plné URL", () => {
    expect(
      extractLatLng(
        "https://www.google.com/maps/place/49.8191212,+18.1301122/@49.8191212,18.1301122,17z/data=!3d49.8191212!4d18.1301122",
      ),
    ).toEqual({ lat: 49.8191212, lng: 18.1301122 });
  });

  it("vytáhne souřadnice z ?q= parametru", () => {
    expect(extractLatLng("https://maps.google.com/?q=49.86,18.19")).toEqual({ lat: 49.86, lng: 18.19 });
    expect(extractLatLng("https://maps.google.com/?q=49.86, 18.19")).toEqual({ lat: 49.86, lng: 18.19 });
  });

  it("vytáhne souřadnice ze středu výřezu (@lat,lng)", () => {
    expect(extractLatLng("https://www.google.com/maps/place/xy/@49.86,18.19,17z")).toEqual({
      lat: 49.86,
      lng: 18.19,
    });
  });

  it("vytáhne souřadnice z /maps/search/ (po rozbalení zkráceného odkazu)", () => {
    expect(extractLatLng("https://www.google.com/maps/search/49.86,+18.19")).toEqual({
      lat: 49.86,
      lng: 18.19,
    });
  });

  it("vytáhne souřadnice v závorce (sdílená poloha z Google Maps na mobilu)", () => {
    expect(extractLatLng("(49.8191212, 18.1301122)")).toEqual({ lat: 49.8191212, lng: 18.1301122 });
    expect(extractLatLng("Nějaké místo (49.8191212, 18.1301122)")).toEqual({
      lat: 49.8191212,
      lng: 18.1301122,
    });
  });

  it("vytáhne rovnou vložené souřadnice (i bez mezery za čárkou)", () => {
    expect(extractLatLng("49.86, 18.19")).toEqual({ lat: 49.86, lng: 18.19 });
    expect(extractLatLng("49.86,18.19")).toEqual({ lat: 49.86, lng: 18.19 });
  });

  it("ořízne okolní bílé znaky", () => {
    expect(extractLatLng("  49.86, 18.19  \n")).toEqual({ lat: 49.86, lng: 18.19 });
  });

  it("zvládne záporné souřadnice", () => {
    expect(extractLatLng("-49.86, -18.19")).toEqual({ lat: -49.86, lng: -18.19 });
  });

  it("vrátí null pro prázdný nebo jen bílý řetězec", () => {
    expect(extractLatLng("")).toBeNull();
    expect(extractLatLng("   ")).toBeNull();
  });

  it("vrátí null pro zkrácený odkaz (maps.app.goo.gl), který appka nerozbaluje", () => {
    expect(extractLatLng("https://maps.app.goo.gl/xyz123")).toBeNull();
  });

  it("vrátí null pro text bez rozpoznatelných souřadnic", () => {
    expect(extractLatLng("U Hošťálkovic, za mostem")).toBeNull();
  });

  it("vrátí null pro souřadnice mimo platný zeměpisný rozsah (poškozený/pozměněný odkaz)", () => {
    expect(extractLatLng("999.99, 18.19")).toBeNull();
    expect(extractLatLng("49.86, 999.99")).toBeNull();
    expect(extractLatLng("https://maps.google.com/?q=-999.99,18.19")).toBeNull();
  });

  it("přijme hraniční hodnoty přesně na okraji platného rozsahu", () => {
    expect(extractLatLng("90.0, 180.0")).toEqual({ lat: 90, lng: 180 });
    expect(extractLatLng("-90.0, -180.0")).toEqual({ lat: -90, lng: -180 });
  });
});
