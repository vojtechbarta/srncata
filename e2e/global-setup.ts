// Naplní čerstvý (prázdný) Firestore emulátor daty pro e2e testy, než
// Playwright spustí první test. Volá se z playwright.config.ts —
// `firebase emulators:exec` (viz `npm run test:e2e`) start emulátoru
// zajistí zvenčí, tenhle skript jen sedne na existující instanci a
// zapíše do ní, stejně jako scripts/seed-emulator.mjs pro ruční vývoj.
// Na rozdíl od něj zakládá i akci s polem/hranicí (pro testy exportu do
// DJI Pilot 2 — viz e2e/event-export.spec.ts) a víc pilotů/vybavení pro
// scénář "nejde smazat pilota, co drží dron" (viz e2e/pilots.spec.ts).
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const ADMIN_EMAIL = "bartavoj@gmail.com";
export const HOLDER_EMAIL = "drzitel@gmail.com";
export const FREE_PILOT_EMAIL = "volny@gmail.com";
export const EVENT_WITH_FIELD_ID = "akce-s-polem";
export const CONFIRMED_EVENT_ID = "akce-potvrzena";
export const PUBLISHED_POST_SLUG = "testovaci-prispevek";
export const EXISTING_SLUG_FOR_COLLISION = "obsazena-adresa";

export default async function globalSetup() {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

  const app = initializeApp({ projectId: "demo-srncata" });
  const db = getFirestore(app);
  console.log("[global-setup] seeding into", process.env.FIRESTORE_EMULATOR_HOST);

  await db.collection("team").doc(ADMIN_EMAIL).set({
    name: "Admin Testovací",
    email: ADMIN_EMAIL,
    phone: "",
    address: "",
    unavailability: [],
  });
  await db.collection("team").doc(HOLDER_EMAIL).set({
    name: "Držitel Dronu",
    email: HOLDER_EMAIL,
    phone: "",
    address: "",
    unavailability: [],
  });
  await db.collection("team").doc(FREE_PILOT_EMAIL).set({
    name: "Volný Pilot",
    email: FREE_PILOT_EMAIL,
    phone: "",
    address: "",
    unavailability: [],
  });

  await db.collection("drones").doc("dron-1").set({
    name: "Dron 1",
    registrationNumber: "CZ-UA-000001",
    currentHolder: "Držitel Dronu",
    note: "",
  });

  await db.collection("events").doc(EVENT_WITH_FIELD_ID).set({
    status: "draft",
    kind: "fawn",
    pilot: "",
    pilotId: null,
    droneId: null,
    coordinatorPhone: "",
    hunterContact: "",
    otherContact: "",
    huntingGroundId: null,
    volunteerCount: null,
    hasNewcomers: false,
    hunterExpected: false,
    startTime: new Date(Date.now() + 86400000).toISOString(),
    locationName: "Louka pro e2e test exportu",
    mapsLink: "",
    areaHa: 2,
    cropType: "",
    // Jeden bod s malým čtvercovým obrysem — appka pro export nepotřebuje
    // reálnou hranici z LPIS, jen nějaký polygon (viz EventFieldsEditor:
    // "Export pro DJI Pilot 2" se nabídne, jakmile f.polygon.length > 0).
    fields: [
      {
        id: "field-1",
        label: "Testovací pole",
        time: "",
        lpisCode: "",
        owner: "",
        ownerAddress: "",
        areaHa: 2,
        lat: 49.86,
        lng: 18.19,
        polygon: [
          {
            points: [
              { lat: 49.861, lng: 18.191 },
              { lat: 49.861, lng: 18.192 },
              { lat: 49.862, lng: 18.192 },
              { lat: 49.862, lng: 18.191 },
            ],
          },
        ],
      },
    ],
    caughtCount: null,
    chasedCount: null,
    deadCount: null,
    hunterPresent: false,
    actualAreaHa: null,
    postNote: "",
    note: "",
    photosLink: "",
    createdBy: ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Potvrzená akce se nedá smazat (viz DELETABLE_STATUSES) — pro test,
  // že appka na tomhle stavu "Smazat akci" vůbec nenabídne.
  await db.collection("events").doc(CONFIRMED_EVENT_ID).set({
    status: "confirmed",
    kind: "fawn",
    pilot: "",
    pilotId: null,
    droneId: null,
    coordinatorPhone: "",
    hunterContact: "",
    otherContact: "",
    huntingGroundId: null,
    volunteerCount: null,
    hasNewcomers: false,
    hunterExpected: false,
    startTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    locationName: "Potvrzená akce pro e2e test",
    mapsLink: "",
    areaHa: null,
    cropType: "",
    fields: [],
    caughtCount: null,
    chasedCount: null,
    deadCount: null,
    hunterPresent: false,
    actualAreaHa: null,
    postNote: "",
    note: "",
    photosLink: "",
    createdBy: ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  await db.collection("posts").doc(PUBLISHED_POST_SLUG).set({
    slug: PUBLISHED_POST_SLUG,
    title: "Testovací zveřejněný příspěvek",
    excerpt: "Krátký popisek pro e2e test veřejného blogu.",
    content: "První odstavec příspěvku.\n\nDruhý odstavec pro jistotu.",
    author: "Admin Testovací",
    status: "published",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("posts").doc(EXISTING_SLUG_FOR_COLLISION).set({
    slug: EXISTING_SLUG_FOR_COLLISION,
    title: "Existující adresa",
    excerpt: "",
    content: "Obsah.",
    author: "",
    status: "published",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}
