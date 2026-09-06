const IMAGE_BLOCK = /^!\[([^\]]*)\]\(([^)]+)\)$/;

/**
 * Vykreslí text příspěvku (odstavce oddělené prázdným řádkem). Odstavec,
 * který je celý ve tvaru `![popisek](odkaz)`, se vykreslí jako obrázek —
 * funguje to jak pro příspěvky psané v appce, tak pro ty, co se zakládají
 * přímo skriptem (viz README, sekce Blog).
 */
export function PostContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const match = block.trim().match(IMAGE_BLOCK);
        if (match) {
          const [, alt, src] = match;
          return (
            <img
              key={i}
              src={src}
              alt={alt}
              className="w-full rounded-2xl border border-line object-cover"
            />
          );
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
