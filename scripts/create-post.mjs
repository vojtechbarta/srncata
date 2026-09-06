// Založí/přepíše jeden příspěvek na blogu přímo v databázi — takhle
// Claude Code zakládá příspěvky, když je nemá psát pilot v appce.
//
// Použití (dokud emulátory běží): node scripts/create-post.mjs cesta/k/prispevku.json
//
// JSON soubor má tvar:
// {
//   "slug": "jak-dopadla-sezona-2026",
//   "title": "Jak dopadla sezóna 2026",
//   "excerpt": "Krátký popisek do seznamu.",
//   "content": "Odstavec.\n\nDalší odstavec.\n\n![popisek fotky](/blog/soubor.jpg)\n\nEště odstavec.",
//   "author": "Vojta",
//   "status": "draft"  // nebo "published"
// }
//
// Obrázky: soubor dej do `public/blog/` (např. public/blog/soubor.jpg) a v
// `content` na něj odkaž jako `![popisek](/blog/soubor.jpg)` — vykreslí se
// jako obrázek, ne jako text (viz src/components/PostContent.tsx).
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Použití: node scripts/create-post.mjs cesta/k/prispevku.json");
  process.exit(1);
}

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

initializeApp({ projectId: "demo-srncata" });
const db = getFirestore();

const post = JSON.parse(readFileSync(jsonPath, "utf-8"));

for (const field of ["slug", "title", "content"]) {
  if (!post[field]) {
    console.error(`Chybí povinné pole "${field}" v ${jsonPath}.`);
    process.exit(1);
  }
}

const now = new Date().toISOString();

await db
  .collection("posts")
  .doc(post.slug)
  .set({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content,
    author: post.author ?? "",
    status: post.status ?? "draft",
    publishedAt: post.publishedAt ?? now,
    createdAt: now,
    updatedAt: now,
  });

console.log(`Příspěvek "${post.title}" uložen (posts/${post.slug}, stav: ${post.status ?? "draft"}).`);
process.exit(0);
