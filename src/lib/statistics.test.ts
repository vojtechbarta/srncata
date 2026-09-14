import { describe, expect, it } from "vitest";
import { byCropType, byMonth, byPilot, otherEventsByMonth, rescuedCount, summarize } from "./statistics";
import type { RescueEvent } from "./types";

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
    youtubeLink: "",
    photos: [],
    coverPhotoId: null,
    createdBy: "bartavoj@gmail.com",
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    ...overrides,
  };
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

  it("přednášku ani jiný výjezd nepočítá — patří do sekce Jiné akce", () => {
    const events = [
      event({ kind: "fawn", caughtCount: 2, chasedCount: 0 }),
      event({ kind: "lecture", caughtCount: 100, chasedCount: 100 }),
      event({ kind: "other", caughtCount: 100, chasedCount: 100 }),
    ];
    expect(summarize(events)).toMatchObject({ eventCount: 1, caught: 2, chased: 0 });
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

  it("přednášku ani jiný výjezd nezapočítá", () => {
    const events = [event({ kind: "lecture", pilot: "Vojta Barta", caughtCount: 9, chasedCount: 0 })];
    expect(byPilot(events)).toEqual([]);
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

  it("počítá jen záchranu srnčat, ne přednášky/jiné výjezdy", () => {
    const events = [
      event({ kind: "fawn", startTime: "2026-05-10T05:00", caughtCount: 3, chasedCount: 0 }),
      event({ kind: "lecture", startTime: "2026-05-11T05:00", caughtCount: 9, chasedCount: 0 }),
    ];
    expect(byMonth(events)).toEqual([{ label: "květen 2026", value: 3 }]);
  });
});

describe("otherEventsByMonth", () => {
  it("počítá jen přednášky/jiné výjezdy, jako počet akcí, ne zachráněná srnčata", () => {
    const events = [
      event({ kind: "lecture", startTime: "2026-05-10T05:00" }),
      event({ kind: "other", startTime: "2026-05-15T05:00" }),
      event({ kind: "other", startTime: "2026-06-01T05:00" }),
      event({ kind: "fawn", startTime: "2026-05-20T05:00", caughtCount: 50, chasedCount: 50 }),
    ];
    expect(otherEventsByMonth(events)).toEqual([
      { label: "květen 2026", value: 2 },
      { label: "červen 2026", value: 1 },
    ]);
  });
});
