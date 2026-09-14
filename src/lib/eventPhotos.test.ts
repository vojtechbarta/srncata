import { describe, expect, it } from "vitest";
import { coverPhoto } from "./eventPhotos";
import type { EventPhoto } from "./types";

function photo(id: string): EventPhoto {
  return { id, url: `https://example.com/${id}.jpg`, createdAt: "2026-01-01T00:00:00.000Z" };
}

describe("coverPhoto", () => {
  it("bez fotek vrátí null", () => {
    expect(coverPhoto({ photos: [], coverPhotoId: null })).toBeNull();
  });

  it("bez vybraného náhledu vrátí první nahranou fotku", () => {
    const photos = [photo("a"), photo("b")];
    expect(coverPhoto({ photos, coverPhotoId: null })).toEqual(photo("a"));
  });

  it("s vybraným náhledem vrátí tu vybranou, i když není první", () => {
    const photos = [photo("a"), photo("b"), photo("c")];
    expect(coverPhoto({ photos, coverPhotoId: "b" })).toEqual(photo("b"));
  });

  it("smazaný/neexistující coverPhotoId spadne zpátky na první fotku", () => {
    const photos = [photo("a"), photo("b")];
    expect(coverPhoto({ photos, coverPhotoId: "uz-smazane-id" })).toEqual(photo("a"));
  });

  it("chybějící photos/coverPhotoId (starší akce bez týhle funkce) se chová jako prázdné", () => {
    expect(coverPhoto({})).toBeNull();
  });
});
