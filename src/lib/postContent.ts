/** Najde první obrázek (`![popisek](odkaz)`) v textu příspěvku — použité jako
 *  náhled v seznamu na blogu, ať nemusí mít každý příspěvek zvlášť pole na
 *  titulní fotku. Viz i src/components/PostContent.tsx, který stejný zápis
 *  vykresluje přímo v textu příspěvku. */
export function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return match ? match[1] : null;
}
