import { describe, expect, it } from "vitest";
import { byCropType, byDistrict, byMonth, byPilot, rescuedCount, summarize } from "./statistics";
import type { HuntingGround, RescueEvent } from "./types";

function event(overrides: Partial<RescueEvent> = {}): RescueEvent {
  return {
    id: "e1",
    status: "done",
    kind: "fawn",
    pilot: "Vojta Barta",
    pilotId: "bartavoj@gmail.com",
    droneId: null,
    coordinatorPhone: "",
    schoolName: "",
    hunterContact: "",
    otherContact: "",
    huntingGroundId: null,
    volunteerCount: null,
    hasNewcomers: false,
    hunterExpected: false,
    startTime: "2026-05-13T05:00",
    locationName: "Ostrava Svinov",
    mapsLink: "",
    areaHa: 10,
    cropType: "Traviny",
    fields: [],
    caughtCount: 2,
    chasedCount: 1,
    deadCount: 0,
    hunterPresent: false,
    actualAreaHa: null,
    postNote: "",
    note: "",
    photosLink: "",
    photos: [],
    coverPhotoId: null,
    createdBy: "bartavoj@gmail.com",
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    ...overrides,
  };
}

function ground(overrides: Partial<HuntingGround> = {}): HuntingGround {
  return { id: "h1", name: "Honitba X", oms: "Ostrava", mapLink: "", wardenName: "", wardenPhone: "", note: "", ...overrides };
}

describe("rescuedCount", () => {
  it("sečte odchycené a vyhnané", () => {
    expect(rescuedCount({ caughtCount: 2, chasedCount: 3 })).toBe(5);
  });

  it("chybějící hodnoty bere jako 0", () => {
    expect(rescuedCount({ caughtCount: null, chasedCount: null })).toBe(0);
  });
});

describe("summarize", () => {
  it("počítá jen odlétané akce", () => {
    const events = [event({ status: "done" }), event({ status: "draft", caughtCount: 100 })];
    expect(summarize(events).eventCount).toBe(1);
    expect(summarize(events).caught).toBe(2);
  });

  it("rozlohu bere ze skutečné, jinak z odhadu", () => {
    const events = [event({ areaHa: 10, actualAreaHa: 7 }), event({ areaHa: 5, actualAreaHa: null })];
    expect(summarize(events).areaHa).toBe(12);
  });

  it("sečte nalezené mrtvé srnčata", () => {
    const events = [event({ deadCount: 1 }), event({ deadCount: 2 }), event({ deadCount: null })];
    expect(summarize(events).dead).toBe(3);
  });
});

describe("byPilot", () => {
  it("seskupí podle jména pilota a seřadí sestupně", () => {
    const events = [
      event({ pilot: "Vojta Barta", caughtCount: 1, chasedCount: 0 }),
      event({ pilot: "Markéta Cycoňová Káňová", caughtCount: 5, chasedCount: 0 }),
      event({ pilot: "Vojta Barta", caughtCount: 2, chasedCount: 0 }),
    ];
    expect(byPilot(events)).toEqual([
      { label: "Markéta Cycoňová Káňová", value: 5 },
      { label: "Vojta Barta", value: 3 },
    ]);
  });

  it("akci bez vyplněného pilota vynechá", () => {
    const events = [event({ pilot: "  ", caughtCount: 9, chasedCount: 0 })];
    expect(byPilot(events)).toEqual([]);
  });
});

describe("byDistrict", () => {
  it("dohledá OMS podle honitby přiřazené k akci", () => {
    const grounds = [ground({ id: "h1", oms: "Ostrava" })];
    const events = [event({ huntingGroundId: "h1", caughtCount: 3, chasedCount: 0 })];
    expect(byDistrict(events, grounds)).toEqual([{ label: "Ostrava", value: 3 }]);
  });

  it("bez honitby nebo bez OMS spadá do Bez honitby", () => {
    const events = [
      event({ huntingGroundId: null, caughtCount: 1, chasedCount: 0 }),
      event({ huntingGroundId: "chybi", caughtCount: 2, chasedCount: 0 }),
    ];
    expect(byDistrict(events, [])).toEqual([{ label: "Bez honitby", value: 3 }]);
  });
});

describe("byCropType", () => {
  it("nevyplněný typ porostu jde do Neuvedeno", () => {
    const events = [
      event({ cropType: "Jetel", caughtCount: 1, chasedCount: 0 }),
      event({ cropType: "", caughtCount: 4, chasedCount: 0 }),
    ];
    expect(byCropType(events)).toEqual([
      { label: "Neuvedeno", value: 4 },
      { label: "Jetel", value: 1 },
    ]);
  });
});

describe("byMonth", () => {
  it("řadí chronologicky, ne podle hodnoty", () => {
    const events = [
      event({ startTime: "2026-06-10T05:00", caughtCount: 1, chasedCount: 0 }),
      event({ startTime: "2026-05-10T05:00", caughtCount: 9, chasedCount: 0 }),
    ];
    expect(byMonth(events)).toEqual([
      { label: "květen 2026", value: 9 },
      { label: "červen 2026", value: 1 },
    ]);
  });
});
