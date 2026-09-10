// Testy firestore.rules proti běžícímu Firestore emulátoru — na rozdíl od
// ostatních testů v projektu (viz README, sekce Testy) tenhle soubor
// vyžaduje emulátor, tak má vlastní npm skript:
//
//   npm run test:rules
//
// (spustí emulátor jen na dobu běhu testů přes `firebase emulators:exec`,
// nezasahuje do dat z `npm run emulators`/`npm run seed`). Pokrývá každé
// `match` v firestore.rules — cíl je zachytit přesně ty regrese, co se
// jinak najdou až ručním klikáním (nebo vůbec), viz nález "Kterýkoli pilot
// smí přidat/odebrat kohokoli z týmu" a navazující opravy z bezpečnostní
// kontroly appky.
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT_ID = "demo-srncata-rules-test";

// `bartavoj@gmail.com` je natvrdo v isAdmin() (viz firestore.rules a
// src/lib/AuthContext.tsx) — testy se schválně netváří, že by šlo být
// adminem pod jiným e-mailem.
const ADMIN_EMAIL = "bartavoj@gmail.com";
const PILOT_EMAIL = "pilot2@gmail.com";
const OTHER_PILOT_EMAIL = "pilot3@gmail.com";
const OUTSIDER_EMAIL = "outsider@gmail.com";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(new URL("./firestore.rules", import.meta.url), "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

/** Kontext přihlášeného uživatele s daným e-mailem (bez ohledu na to, jestli je v `team`). */
function asUser(email: string) {
  return testEnv.authenticatedContext(email, { email }).firestore();
}

function asAnonymous() {
  return testEnv.unauthenticatedContext().firestore();
}

/** Založí fixture data přímo (obchází pravidla) — stejný tvar dat, jaký appka doopravdy ukládá. */
async function seed(fn: (db: import("firebase/firestore").Firestore) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

describe("firestore.rules — team", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "team", ADMIN_EMAIL), { name: "Admin", email: ADMIN_EMAIL });
      await setDoc(doc(db, "team", PILOT_EMAIL), { name: "Pilot", email: PILOT_EMAIL });
      await setDoc(doc(db, "team", OTHER_PILOT_EMAIL), { name: "Jiný pilot", email: OTHER_PILOT_EMAIL });
    });
  });

  it("get vlastního záznamu jde i bez členství v týmu (appka to volá hned po přihlášení)", async () => {
    await assertSucceeds(getDoc(doc(asUser(OUTSIDER_EMAIL), "team", OUTSIDER_EMAIL)));
  });

  it("get cizího záznamu bez členství v týmu je zamítnutý", async () => {
    await assertFails(getDoc(doc(asUser(OUTSIDER_EMAIL), "team", PILOT_EMAIL)));
  });

  it("list smí jen člen týmu", async () => {
    await assertSucceeds(getDocs(collection(asUser(PILOT_EMAIL), "team")));
    await assertFails(getDocs(collection(asUser(OUTSIDER_EMAIL), "team")));
  });

  it("kdokoli z týmu smí přidat nového pilota (create)", async () => {
    await assertSucceeds(
      setDoc(doc(asUser(PILOT_EMAIL), "team", "novy@gmail.com"), { name: "Nový", email: "novy@gmail.com" }),
    );
  });

  it("kdo není v týmu, nesmí přidat ani sám sebe", async () => {
    await assertFails(
      setDoc(doc(asUser(OUTSIDER_EMAIL), "team", OUTSIDER_EMAIL), { name: "X", email: OUTSIDER_EMAIL }),
    );
  });

  it("kdokoli z týmu smí upravit cizí záznam (např. nedostupnost)", async () => {
    await assertSucceeds(updateDoc(doc(asUser(PILOT_EMAIL), "team", OTHER_PILOT_EMAIL), { phone: "123" }));
  });

  it("smazat cizí záznam smí jen admin", async () => {
    await assertFails(deleteDoc(doc(asUser(PILOT_EMAIL), "team", OTHER_PILOT_EMAIL)));
    await assertSucceeds(deleteDoc(doc(asUser(ADMIN_EMAIL), "team", OTHER_PILOT_EMAIL)));
  });

  it("smazat sám sebe smí kdokoli (i bez admina) — kvůli přejmenování a self-service odchodu z týmu", async () => {
    await assertSucceeds(deleteDoc(doc(asUser(PILOT_EMAIL), "team", PILOT_EMAIL)));
  });
});

describe("firestore.rules — drones / equipment / huntingGrounds", () => {
  for (const collectionName of ["drones", "equipment", "huntingGrounds"]) {
    it(`${collectionName}: číst i psát smí jen člen týmu`, async () => {
      await seed(async (db) => {
        await setDoc(doc(db, "team", PILOT_EMAIL), { name: "Pilot", email: PILOT_EMAIL });
        await setDoc(doc(db, collectionName, "item-1"), { name: "Věc" });
      });

      await assertSucceeds(getDoc(doc(asUser(PILOT_EMAIL), collectionName, "item-1")));
      await assertFails(getDoc(doc(asUser(OUTSIDER_EMAIL), collectionName, "item-1")));

      await assertSucceeds(updateDoc(doc(asUser(PILOT_EMAIL), collectionName, "item-1"), { name: "Jiná věc" }));
      await assertFails(updateDoc(doc(asUser(OUTSIDER_EMAIL), collectionName, "item-1"), { name: "Hacknuto" }));
    });
  }
});

describe("firestore.rules — publicAvailability", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "team", PILOT_EMAIL), { name: "Pilot", email: PILOT_EMAIL });
      await setDoc(doc(db, "publicAvailability", "2026-09-10"), {
        date: "2026-09-10",
        dronesTotal: 2,
        dronesFree: 1,
        canFly: true,
      });
    });
  });

  it("číst smí úplně kdokoli, i bez přihlášení", async () => {
    await assertSucceeds(getDoc(doc(asAnonymous(), "publicAvailability", "2026-09-10")));
  });

  it("psát smí jen člen týmu", async () => {
    await assertFails(
      setDoc(doc(asAnonymous(), "publicAvailability", "2026-09-11"), { date: "2026-09-11" }),
    );
    await assertFails(
      setDoc(doc(asUser(OUTSIDER_EMAIL), "publicAvailability", "2026-09-11"), { date: "2026-09-11" }),
    );
    await assertSucceeds(
      setDoc(doc(asUser(PILOT_EMAIL), "publicAvailability", "2026-09-11"), { date: "2026-09-11" }),
    );
  });
});

describe("firestore.rules — events", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "team", PILOT_EMAIL), { name: "Pilot", email: PILOT_EMAIL });
      await setDoc(doc(db, "events", "draft-event"), { status: "draft", locationName: "Koncept" });
      await setDoc(doc(db, "events", "confirmed-event"), { status: "confirmed", locationName: "Potvrzeno" });
      await setDoc(doc(db, "events", "cancelled-event"), { status: "cancelled", locationName: "Zrušeno" });
      await setDoc(doc(db, "events", "done-event"), { status: "done", locationName: "Odlétáno" });
    });
  });

  it("vytvořit/upravit smí jen člen týmu", async () => {
    await assertFails(
      setDoc(doc(asUser(OUTSIDER_EMAIL), "events", "nova"), { status: "draft", locationName: "X" }),
    );
    await assertSucceeds(
      setDoc(doc(asUser(PILOT_EMAIL), "events", "nova"), { status: "draft", locationName: "X" }),
    );
    await assertSucceeds(updateDoc(doc(asUser(PILOT_EMAIL), "events", "draft-event"), { locationName: "Y" }));
  });

  it("smazat jde jen koncept nebo zrušenou akci — potvrzenou/odlétanou ne", async () => {
    await assertSucceeds(deleteDoc(doc(asUser(PILOT_EMAIL), "events", "draft-event")));
    await assertSucceeds(deleteDoc(doc(asUser(PILOT_EMAIL), "events", "cancelled-event")));
    await assertFails(deleteDoc(doc(asUser(PILOT_EMAIL), "events", "confirmed-event")));
    await assertFails(deleteDoc(doc(asUser(PILOT_EMAIL), "events", "done-event")));
  });

  it("kdo není v týmu, nesmí smazat ani smazatelnou akci", async () => {
    await assertFails(deleteDoc(doc(asUser(OUTSIDER_EMAIL), "events", "draft-event")));
  });
});

describe("firestore.rules — posts (veřejný blog)", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "team", PILOT_EMAIL), { name: "Pilot", email: PILOT_EMAIL });
      await setDoc(doc(db, "posts", "zverejneny"), { status: "published", title: "Zveřejněno", slug: "zverejneny" });
      await setDoc(doc(db, "posts", "koncept"), { status: "draft", title: "Koncept", slug: "koncept" });
    });
  });

  it("get zveřejněného příspěvku jde i bez přihlášení", async () => {
    await assertSucceeds(getDoc(doc(asAnonymous(), "posts", "zverejneny")));
  });

  it("get konceptu bez přihlášení/členství je zamítnutý", async () => {
    await assertFails(getDoc(doc(asAnonymous(), "posts", "koncept")));
    await assertFails(getDoc(doc(asUser(OUTSIDER_EMAIL), "posts", "koncept")));
    await assertSucceeds(getDoc(doc(asUser(PILOT_EMAIL), "posts", "koncept")));
  });

  it("list bez filtru na status a bez členství v týmu je zamítnutý (i když by se hodily jen zveřejněné)", async () => {
    // Přesně tohle je důvod, proč BlogPage.tsx vždycky přidává
    // where("status","==","published") — bez filtru zamítne celý dotaz,
    // ne že by tiše vrátil jen povolené dokumenty.
    await assertFails(getDocs(collection(asAnonymous(), "posts")));
  });

  it("list s filtrem na published jde i bez přihlášení — přesně jak appka volá na veřejném blogu", async () => {
    const snap = await assertSucceeds(
      getDocs(query(collection(asAnonymous(), "posts"), where("status", "==", "published"))),
    );
    expect(snap.docs.map((d) => d.id)).toEqual(["zverejneny"]);
  });

  it("list bez filtru smí člen týmu (uvidí koncepty i zveřejněné)", async () => {
    const snap = await assertSucceeds(getDocs(collection(asUser(PILOT_EMAIL), "posts")));
    expect(snap.docs.map((d) => d.id).sort()).toEqual(["koncept", "zverejneny"]);
  });

  it("psát (založit/upravit/smazat) smí jen člen týmu", async () => {
    await assertFails(
      setDoc(doc(asAnonymous(), "posts", "novy"), { status: "draft", title: "X", slug: "novy" }),
    );
    await assertFails(deleteDoc(doc(asUser(OUTSIDER_EMAIL), "posts", "zverejneny")));
    await assertSucceeds(
      setDoc(doc(asUser(PILOT_EMAIL), "posts", "novy"), { status: "draft", title: "X", slug: "novy" }),
    );
  });
});
