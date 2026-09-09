import { describe, expect, it } from "vitest";
import { mainRing, safeFileName } from "./fieldGeo";

describe("mainRing", () => {
  it("vybere největší z vnějších obrysů", () => {
    const small = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
    ];
    const big = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
      { lat: 1, lng: 0 },
      { lat: 0.5, lng: 0.5 },
    ];
    expect(mainRing([small, big])).toBe(big);
  });

  it("prázdný polygon vrátí prázdné pole", () => {
    expect(mainRing([])).toEqual([]);
  });

  it("jediný obrys vrátí beze změny", () => {
    const ring = [{ lat: 0, lng: 0 }];
    expect(mainRing([ring])).toBe(ring);
  });
});

describe("safeFileName", () => {
  it("nahradí mezery a lomítka pomlčkou", () => {
    expect(safeFileName("pole u lesa/část 2")).toBe("pole-u-lesa-část-2");
  });

  it("zachová diakritiku (jen odstraní nebezpečné znaky pro souborový systém)", () => {
    expect(safeFileName("Hošťálkovice")).toBe("Hošťálkovice");
  });

  it("ořízne úvodní a koncové pomlčky", () => {
    expect(safeFileName("--pole--")).toBe("pole");
  });

  it("pro prázdný/jen-oddělovačový vstup vrátí záložní název 'pole'", () => {
    expect(safeFileName("")).toBe("pole");
    expect(safeFileName("///")).toBe("pole");
  });
});
