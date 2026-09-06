// Naplní Firestore emulátor ukázkovými daty pro lokální vývoj.
// Spustit až BĚŽÍ emulátory (npm run emulators), v druhém terminálu: npm run seed
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

initializeApp({ projectId: "demo-srncata" });
const db = getFirestore();

const team = [
  { email: "bartavoj@gmail.com", name: "Vojta" },
  { email: "pilot2@gmail.com", name: "Pilot 2 (uprav v Console)" },
  { email: "pilot3@gmail.com", name: "Pilot 3 (uprav v Console)" },
];

const drones = [
  { name: "Dron 1", currentHolder: "Vojta", note: "" },
  { name: "Dron 2", currentHolder: "", note: "nabíjí se" },
];

async function seed() {
  for (const member of team) {
    await db.collection("team").doc(member.email).set(member);
  }

  const droneRefs = [];
  for (const drone of drones) {
    const ref = await db.collection("drones").add(drone);
    droneRefs.push(ref);
  }

  const now = new Date();
  const tomorrowDawn = new Date(now);
  tomorrowDawn.setDate(tomorrowDawn.getDate() + 1);
  tomorrowDawn.setHours(4, 30, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(5, 0, 0, 0);

  await db.collection("events").add({
    status: "confirmed",
    pilot: "Vojta",
    droneId: droneRefs[0].id,
    coordinatorPhone: "+420731935211",
    hunterContact: "p. Novák (myslivecké sdružení)",
    otherContact: "",
    startTime: tomorrowDawn.toISOString(),
    locationName: "Louka u Hošťálkovic",
    mapsLink: "https://maps.google.com/?q=49.8619,18.1969",
    caughtCount: null,
    chasedCount: null,
    note: "Domluveno přes WhatsApp, sečení plánováno na dopoledne.",
    photosLink: "",
    createdBy: "bartavoj@gmail.com",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  await db.collection("events").add({
    status: "draft",
    pilot: "",
    droneId: null,
    coordinatorPhone: "",
    hunterContact: "",
    otherContact: "",
    startTime: nextWeek.toISOString(),
    locationName: "Pole u Krmelína — zatím upřesnit",
    mapsLink: "",
    caughtCount: null,
    chasedCount: null,
    note: "",
    photosLink: "",
    createdBy: "bartavoj@gmail.com",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  console.log("Emulátor naplněn ukázkovými daty (tým, drony, 2 akce).");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
