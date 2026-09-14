// Jednorázová migrace: staré položky vybavení kategorie "crate" (přepravky)
// měly `name` jen jako holé číslo ("5") — appka teď (viz `equipmentItemName`
// v src/lib/types.ts) generuje čitelný název "Přepravka č.5" i pro ně, ať
// se to nikde nezobrazuje bez kontextu (např. u pilota v seznamu vybavení,
// co má u sebe). Nové položky (přes "Doplnit chybějící" v EquipmentPage) už
// vzniknou rovnou správně, tenhle skript jen dorovná ty existující.
//
//   node scripts/rename-crates.mjs
//
// Potřebuje service-account.json v kořeni projektu (viz README).
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection("equipment").where("category", "==", "crate").get();

  const batch = db.batch();
  let changed = 0;
  for (const docSnap of snap.docs) {
    const item = docSnap.data();
    const wantName = `Přepravka č.${item.sortIndex}`;
    if (item.name !== wantName) {
      batch.update(docSnap.ref, { name: wantName });
      changed++;
    }
  }
  if (changed > 0) await batch.commit();
  console.log(`Hotovo — zkontrolováno ${snap.size} přepravek, přejmenováno ${changed}.`);
}

main();
