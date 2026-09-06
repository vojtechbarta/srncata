/** "Sečení u Hošťálkovic" -> "seceni-u-hostalkovic" (bez diakritiky, url-friendly). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // odstranit diakritiku rozloženou na kombinující znaky
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
