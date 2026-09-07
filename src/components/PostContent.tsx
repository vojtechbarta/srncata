import { YouTubeFacade } from "./YouTubeFacade";

const IMAGE_BLOCK = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const VIDEO_BLOCK = /^\[video\]\(([^)]+)\)$/;

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{6,})/,
  );
  return match ? match[1] : null;
}

/**
 * Vykreslí text příspěvku (odstavce oddělené prázdným řádkem). Odstavec,
 * který je celý ve tvaru `![popisek](odkaz)`, se vykreslí jako obrázek,
 * a `[video](odkaz na YouTube)` jako vložené video — funguje to jak pro
 * příspěvky psané v appce, tak pro ty, co se zakládají přímo skriptem
 * (viz README, sekce Blog).
 */
export function PostContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        const imageMatch = trimmed.match(IMAGE_BLOCK);
        if (imageMatch) {
          const [, alt, src] = imageMatch;
          return (
            <img
              key={i}
              src={src}
              alt={alt}
              className="w-full rounded-2xl border border-line object-cover"
            />
          );
        }

        const videoMatch = trimmed.match(VIDEO_BLOCK);
        if (videoMatch) {
          const videoId = extractYouTubeId(videoMatch[1]);
          if (videoId) {
            return <YouTubeFacade key={i} videoId={videoId} title="Video k příspěvku" />;
          }
        }

        return (
          <p key={i} className="text-lg leading-relaxed text-ink-soft">
            {block}
          </p>
        );
      })}
    </div>
  );
}
