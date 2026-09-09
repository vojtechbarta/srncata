import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("odstraní diakritiku a převede na malá písmena", () => {
    expect(slugify("Sečení u Hošťálkovic")).toBe("seceni-u-hostalkovic");
  });

  it("nahradí interpunkci a mezery pomlčkou", () => {
    expect(slugify("Ahoj, světe! Jak se máš?")).toBe("ahoj-svete-jak-se-mas");
  });

  it("ořízne úvodní a koncové pomlčky", () => {
    expect(slugify("  --Ukázka--  ")).toBe("ukazka");
  });

  it("sloučí víc oddělovačů za sebou do jedné pomlčky", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("ořízne výsledek na 80 znaků", () => {
    const result = slugify("a".repeat(200));
    expect(result.length).toBe(80);
  });

  it("prázdný vstup dá prázdný výsledek", () => {
    expect(slugify("")).toBe("");
  });
});
