import { describe, expect, it, vi } from "vitest";
import { coverPhoto, processPhotoFile, HeicConversionError } from "./eventPhotos";
import type { EventPhoto } from "./types";

// Reálný případ z produkce: heic2any (přesněji jeho WASM dekodér
// libheif-js) na některých HEIC z novějších iPhonů spadne s "ERR_LIBHEIF
// format not supported", i když jde o běžnou fotku bez HDR/burstu.
vi.mock("heic2any", () => ({
  default: vi.fn().mockRejectedValue(new Error("ERR_LIBHEIF format not supported")),
}));

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

describe("processPhotoFile", () => {
  it("HEIC, co heic2any neumí dekódovat, ohlásí jako HeicConversionError (ne obecnou chybu)", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "IMG_7621.heic", { type: "image/heic" });
    await expect(processPhotoFile(file)).rejects.toThrow(HeicConversionError);
  });
});
