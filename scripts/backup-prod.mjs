// Ruční záloha produkční databáze — stáhne všechny kolekce (team, drones,
// events, posts) do lokálních JSON souborů ve `backups/<datum>/`.
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
// `backups/` je v .gitignore — obsahuje osobní údaje pilotů (telefon,
// adresa) a NESMÍ se dostat do (veřejného) gitu. Zálohy zůstávají jen
// lokálně na tomhle disku; pro jistotu si čas od času složku `backups/`
// zkopíruj i jinam (např. na externí disk nebo do soukromého cloudu).
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const COLLECTIONS = ["team", "drones", "events", "posts"];

const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
const outDir = new URL(`../backups/${stamp}/`, import.meta.url);
mkdirSync(outDir, { recursive: true });

let total = 0;
for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  writeFileSync(new URL(`${name}.json`, outDir), JSON.stringify(docs, null, 2), "utf-8");
  console.log(`  ${name}: ${docs.length} dokumentů`);
  total += docs.length;
}

console.log(`\nZáloha hotová (${total} dokumentů celkem) → backups/${stamp}/`);
process.exit(0);
