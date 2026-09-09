// Přepočet veřejně čitelného agregátu dostupnosti (kolik dronů/pilotů je
// volno v který den) — viz kolekce `publicAvailability` a veřejná stránka
// `/dostupnost`. Appka nemá vlastní backend (žádné Cloud Functions), tak
// se tohle spouští rovnou z klienta přihlášeného člena týmu, pokaždé po
// akci, co dostupnost ovlivní (uložení/smazání akce, změna nedostupnosti
// pilota) — viz volání v EventDetailPage a PilotsPage.
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { dateKey } from "./dateKey";
import type { Drone, RescueEvent, TeamMember } from "./types";

/** Kolik dní dopředu se počítá — orientační plánovací horizont, ne přesný slib. */
const WINDOW_DAYS = 90;

const ACTIVE_STATUSES: RescueEvent["status"][] = ["draft", "confirmed"];

/**
 * Nespoléhá na už načtený stav appky v Reactu (ten může být těsně po
 * vlastním zápisu krátce pozadu) — `drones`/`team`/`events` si vždy načte
 * čerstvě přímo z Firestore. Volá se jako "fire and forget" (viz
 * volající místa) — nezdařený přepočet nemá blokovat ani kazit hlavní
 * akci (uložení akce/pilota), jen se zaloguje.
 */
export async function recomputePublicAvailability(): Promise<void> {
  const [droneSnap, teamSnap, eventSnap] = await Promise.all([
    getDocs(collection(db, "drones")),
    getDocs(collection(db, "team")),
    getDocs(collection(db, "events")),
  ]);

  const drones = droneSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Drone, "id">) }));
  const team = teamSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) }));
  const events = eventSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RescueEvent, "id">) }))
    .filter((e) => ACTIVE_STATUSES.includes(e.status));

  const dronesTotal = drones.length;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const batch = writeBatch(db);
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const day = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + i);
    const key = dateKey(day);
    const eventsThatDay = events.filter((e) => dateKey(e.startTime) === key);

    const busyDroneIds = new Set(eventsThatDay.filter((e) => e.droneId).map((e) => e.droneId as string));
    const dronesFree = dronesTotal - drones.filter((d) => busyDroneIds.has(d.id)).length;

    const pilotsFree = team.filter((pilot) => {
      const busy = eventsThatDay.some((e) =>
        e.pilotId ? e.pilotId === pilot.id : pilot.name && e.pilot === pilot.name,
      );
      if (busy) return false;
      return !(pilot.unavailability ?? []).some((w) => key >= w.from && key <= w.to);
    }).length;

    batch.set(doc(db, "publicAvailability", key), {
      date: key,
      dronesTotal,
      dronesFree,
      canFly: dronesFree > 0 && pilotsFree > 0,
      updatedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
}
