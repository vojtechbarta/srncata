// Ruční záloha produkční databáze — stáhne všechny kolekce (team, drones,
// events, posts) do lokálních JSON souborů v iCloud Drive, do složky
// "Zaloha_srncata" — Mac ji sám synchronizuje, takže záloha nezůstává
// jen na tomhle disku.
//
// Používáme tohle misto placených Firestore "Managed backups" (ty vyžadují
// plán Blaze/billing, projekt zatím jede na free plánu Spark) — pro
// velikost dat tohohle spolku úplně stačí.
//
// Potřebuje service-account.json v kořeni projektu (viz README, sekce
// Blog/produkce).
//
//   node scripts/backup-prod.mjs
//
// Zálohy obsahují osobní údaje pilotů (telefon, adresa) — proto míří jen
// do soukromého iCloud Drive, NIKDY ne do (veřejného) gitu.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const COLLECTIONS = ["team", "drones", "events", "posts"];

const ICLOUD_BACKUP_DIR = join(
  homedir(),
  "Library/Mobile Documents/com~apple~CloudDocs/Zaloha_srncata",
);

const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
const outDir = join(ICLOUD_BACKUP_DIR, stamp);
mkdirSync(outDir, { recursive: true });

let total = 0;
for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(docs, null, 2), "utf-8");
  console.log(`  ${name}: ${docs.length} dokumentů`);
  total += docs.length;
}

console.log(`\nZáloha hotová (${total} dokumentů celkem) → ${outDir}`);
process.exit(0);
