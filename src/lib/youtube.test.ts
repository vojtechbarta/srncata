import { describe, expect, it } from "vitest";
import { extractYouTubeId } from "./youtube";

describe("extractYouTubeId", () => {
  it("rozpozná běžný watch odkaz", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rozpozná watch odkaz s extra parametry (např. &t=30s)", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe("dQw4w9WgXcQ");
  });

  it("rozpozná zkrácený youtu.be odkaz", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rozpozná embed odkaz", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rozpozná shorts odkaz", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("prázdný řetězec vrátí null", () => {
    expect(extractYouTubeId("")).toBeNull();
  });

  it("neplatnou URL vrátí null", () => {
    expect(extractYouTubeId("tohle neni odkaz")).toBeNull();
  });

  it("odkaz na jinou stránku vrátí null", () => {
    expect(extractYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("odkaz bez ID videa vrátí null", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch")).toBeNull();
  });
});
