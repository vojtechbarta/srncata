import { describe, expect, it } from "vitest";
import { formatDateShort, formatDateTime, telHref } from "./format";

// Stejné formátovače jako v src/lib/format.ts — porovnáváme strukturu
// výstupu (spojení datum+čas, ošetření neplatné/prázdné hodnoty), ne
// natvrdo očekávaný řetězec, ať test nezávisí na konkrétní verzi ICU dat.
const dateFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" });

describe("formatDateTime", () => {
  it("spojí datum a čas oddělené čárkou", () => {
    const d = new Date(2026, 8, 6, 5, 30);
    expect(formatDateTime(d.toISOString())).toBe(`${dateFormatter.format(d)}, ${timeFormatter.format(d)}`);
  });

  it("vrátí em pomlčku pro prázdný řetězec", () => {
    expect(formatDateTime("")).toBe("—");
  });

  it("vrátí em pomlčku pro neplatné datum", () => {
    expect(formatDateTime("není datum")).toBe("—");
  });
});

describe("formatDateShort", () => {
  it("naformátuje jen datum, bez času", () => {
    const d = new Date(2026, 8, 6);
    expect(formatDateShort(d.toISOString())).toBe(dateFormatter.format(d));
  });

  it("vrátí prázdný řetězec pro prázdný nebo neplatný vstup", () => {
    expect(formatDateShort("")).toBe("");
    expect(formatDateShort("není datum")).toBe("");
  });
});

describe("telHref", () => {
  it("vytvoří tel: odkaz a odstraní mezery z čísla", () => {
    expect(telHref("+420 777 123 456")).toBe("tel:+420777123456");
  });

  it("nechá číslo beze mezer beze změny", () => {
    expect(telHref("+420777123456")).toBe("tel:+420777123456");
  });
});
