/**
 * Vytáhne ID videa z libovolného tvaru YouTube odkazu (watch?v=, youtu.be/,
 * embed/, shorts/), i s extra parametry v adrese (např. „&t=30s“ po
 * zkopírování z appky YouTube). Vrátí `null`, když odkaz nejde rozpoznat —
 * appka pak přehrávač vůbec nezobrazí, ať nepůsobí rozbitě.
 */
export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const isValidId = (id: string | null) => (id && /^[\w-]{11}$/.test(id) ? id : null);

  if (host === "youtu.be") {
    return isValidId(parsed.pathname.slice(1));
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (parsed.pathname === "/watch") return isValidId(parsed.searchParams.get("v"));
    const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    if (match) return isValidId(match[1]);
  }

  return null;
}
