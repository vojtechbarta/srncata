// Testy storage.rules proti běžícímu Firestore+Storage emulátoru (viz
// npm run test:rules — stejný wrapper, stejné withSecurityRulesDisabled
// seedování jako firestore.rules.test.ts, jen navíc storage emulátor).
// `isTeamMember()` v storage.rules čte `firestore.exists()` napříč
// službami, takže test potřebuje mít nastavené i Firestore, ne jen
// Storage samotné.
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from "vitest";

// Musí sedět s `--project demo-srncata`, pod kterým `npm run test:rules`
// emulátory startuje — `firestore.exists()` v storage.rules je cross-
// service volání do Firestore emulátoru té samé instance/projektu, ne
// do libovolného izolovaného projektu, co by si test vymyslel sám.
const PROJECT_ID = "demo-srncata";
const ADMIN_EMAIL = "bartavoj@gmail.com";
const OUTSIDER_EMAIL = "outsider@gmail.com";

// Hlavička JPEG stačí — appka jen ověřuje pravidla (typ/velikost/kdo
// smí), ne že jde o platný obrázek.
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 0, 0, 0]);

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(new URL("./firestore.rules", import.meta.url), "utf8"),
    },
    storage: {
      rules: readFileSync(new URL("./storage.rules", import.meta.url), "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

function asUser(email: string) {
  return testEnv.authenticatedContext(email, { email }).storage();
}

function asAnonymous() {
  return testEnv.unauthenticatedContext().storage();
}

beforeEach(async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "team", ADMIN_EMAIL), { name: "Admin", email: ADMIN_EMAIL });
  });
});

describe("storage.rules — fotky k akci (events/{eventId}/{soubor})", () => {
  it("nahrát i číst smí jen člen týmu", async () => {
    const path = "events/akce-1/foto-1.jpg";
    await assertFails(uploadBytes(ref(asAnonymous(), path), JPEG_BYTES, { contentType: "image/jpeg" }));
    await assertFails(
      uploadBytes(ref(asUser(OUTSIDER_EMAIL), path), JPEG_BYTES, { contentType: "image/jpeg" }),
    );
    await assertSucceeds(
      uploadBytes(ref(asUser(ADMIN_EMAIL), path), JPEG_BYTES, { contentType: "image/jpeg" }),
    );

    await assertSucceeds(getBytes(ref(asUser(ADMIN_EMAIL), path)));
    await assertFails(getBytes(ref(asAnonymous(), path)));
    await assertFails(getBytes(ref(asUser(OUTSIDER_EMAIL), path)));
  });

  it("odmítne soubor, co není obrázek", async () => {
    const path = "events/akce-1/soubor.pdf";
    await assertFails(
      uploadBytes(ref(asUser(ADMIN_EMAIL), path), JPEG_BYTES, { contentType: "application/pdf" }),
    );
  });

  it("odmítne soubor nad 8 MB (appka sama posílá zmenšené na max. 1900 px)", async () => {
    const path = "events/akce-1/moc-velky.jpg";
    const big = new Uint8Array(8 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(asUser(ADMIN_EMAIL), path), big, { contentType: "image/jpeg" }));
  });

  it("smazat smí jen člen týmu", async () => {
    const path = "events/akce-1/ke-smazani.jpg";
    await uploadBytes(ref(asUser(ADMIN_EMAIL), path), JPEG_BYTES, { contentType: "image/jpeg" });

    await assertFails(deleteObject(ref(asUser(OUTSIDER_EMAIL), path)));
    await assertFails(deleteObject(ref(asAnonymous(), path)));
    await assertSucceeds(deleteObject(ref(asUser(ADMIN_EMAIL), path)));
  });
});
