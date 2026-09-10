import { describe, expect, it } from "vitest";
import { canGoToNextMonth } from "./publicAvailability";

const TODAY = new Date(2026, 8, 10); // 10. 9. 2026 (měsíce v JS Date jsou 0-indexované)

describe("canGoToNextMonth", () => {
  it("bez jakýchkoli dat (prázdná kolekce) navigaci neomezuje", () => {
    expect(canGoToNextMonth([], 2026, 8, TODAY)).toBe(true);
    expect(canGoToNextMonth([], 2027, 5, TODAY)).toBe(true);
  });

  it("uvnitř spočítaného okna dovolí přejít i na poslední měsíc, co má data", () => {
    const days = [{ date: "2026-09-10" }, { date: "2026-11-30" }];
    expect(canGoToNextMonth(days, 2026, 8, TODAY)).toBe(true); // září
    expect(canGoToNextMonth(days, 2026, 10, TODAY)).toBe(true); // listopad — poslední s daty
  });

  it("za hranicí spočítaného okna (celý zobrazený měsíc bez dat) navigaci dál zamkne", () => {
    const days = [{ date: "2026-09-10" }, { date: "2026-11-30" }];
    expect(canGoToNextMonth(days, 2026, 11, TODAY)).toBe(false); // prosinec — bez dat
  });

  it("zastaralá data (poslední spočítaný den v minulosti vůči dnešku) navigaci neomezují", () => {
    // Typicky appka dlouho neběžela (mimo sezónu) — recomputePublicAvailability
    // se nespustil měsíce, poslední spočítaný den je dávno pryč.
    const days = [{ date: "2025-01-15" }];
    expect(canGoToNextMonth(days, 2026, 8, TODAY)).toBe(true);
    expect(canGoToNextMonth(days, 2030, 0, TODAY)).toBe(true);
  });

  it("hraniční případ: poslední spočítaný den je přesně dnešní měsíc", () => {
    const days = [{ date: "2026-09-30" }];
    expect(canGoToNextMonth(days, 2026, 8, TODAY)).toBe(true); // září — má data
    expect(canGoToNextMonth(days, 2026, 9, TODAY)).toBe(false); // říjen — už ne
  });
});
