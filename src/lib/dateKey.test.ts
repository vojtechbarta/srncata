import { describe, expect, it } from "vitest";
import { dateKey } from "./dateKey";

describe("dateKey", () => {
  it("naformátuje Date na 'YYYY-MM-DD' v místním čase", () => {
    // Date(rok, měsíc [0-indexovaný], den) je vždy místní čas — bez
    // závislosti na časovém pásmu stroje, na kterém test běží.
    expect(dateKey(new Date(2026, 8, 8))).toBe("2026-09-08");
  });

  it("doplní nuly u jednociferného měsíce a dne", () => {
    expect(dateKey(new Date(2026, 0, 3))).toBe("2026-01-03");
  });

  it("přijme i ISO datetime řetězec bez časové zóny (parsuje se jako místní čas)", () => {
    expect(dateKey("2026-09-08T10:00:00")).toBe("2026-09-08");
  });

  it("vrátí prázdný řetězec pro neplatné datum", () => {
    expect(dateKey("není datum")).toBe("");
    expect(dateKey("")).toBe("");
  });

  it("řetězce jdou porovnávat lexikálně jako rozsah dat", () => {
    const from = dateKey(new Date(2026, 5, 1));
    const to = dateKey(new Date(2026, 5, 30));
    const inRange = dateKey(new Date(2026, 5, 15));
    expect(inRange >= from && inRange <= to).toBe(true);
  });
});
