// Jednorázově naplní `publicAvailability` (viz src/lib/publicAvailability.ts)
// — appka ji jinak přepočítává sama průběžně (po uložení akce/nedostupnosti
// pilota), ale hned po nasazení téhle funkce je kolekce prázdná a veřejná
// stránka /dostupnost by až do první další akce v appce byla prázdná.
// Spustit ideálně jednou, hned po `firebase deploy --only firestore:rules`
// s novým pravidlem pro `publicAvailability`:
//
//   node scripts/backfill-availability.mjs
//
// Potřebuje service-account.json v kořeni projektu (viz README).
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const WINDOW_DAYS = 90;
const ACTIVE_STATUSES = new Set(["draft", "confirmed"]);

/** Stejné jako src/lib/dateKey.ts — kopie, ať skript nezávisí na TS buildu. */
function dateKey(value) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function main() {
  const [droneSnap, teamSnap, eventSnap] = await Promise.all([
    db.collection("drones").get(),
    db.collection("team").get(),
    db.collection("events").get(),
  ]);

  const drones = droneSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const team = teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const events = eventSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((e) => ACTIVE_STATUSES.has(e.status));

  const dronesTotal = drones.length;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const batch = db.batch();
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const day = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + i);
    const key = dateKey(day);
    const eventsThatDay = events.filter((e) => dateKey(e.startTime) === key);

    const busyDroneIds = new Set(eventsThatDay.filter((e) => e.droneId).map((e) => e.droneId));
    const dronesFree = dronesTotal - drones.filter((d) => busyDroneIds.has(d.id)).length;

    const pilotsFree = team.filter((pilot) => {
      const busy = eventsThatDay.some((e) =>
        e.pilotId ? e.pilotId === pilot.id : pilot.name && e.pilot === pilot.name,
      );
      if (busy) return false;
      return !(pilot.unavailability ?? []).some((w) => key >= w.from && key <= w.to);
    }).length;

    batch.set(db.collection("publicAvailability").doc(key), {
      date: key,
      dronesTotal,
      dronesFree,
      canFly: dronesFree > 0 && pilotsFree > 0,
      updatedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  console.log(`Hotovo — spočítáno ${WINDOW_DAYS} dní (${dronesTotal} dronů, ${team.length} pilotů v týmu).`);
}

main();
