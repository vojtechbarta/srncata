import type { Page } from "@playwright/test";
import { getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";

let adminApp: ReturnType<typeof initializeApp> | null = null;
function admin() {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  adminApp ??= initializeApp({ projectId: "demo-srncata" }, "e2e-admin");
  return adminApp;
}

/**
 * Přihlásí se přes vlastní token (Auth emulátor) na pomocné stránce
 * `/login-harness.html` — rychlejší a spolehlivější pro automatizaci
 * než klikání přes falešné Google popup okno (viz komentář v tom
 * souboru). Skutečné popup okno pokrývá samostatný test
 * ("přihlašovací tlačítko otevře Google popup"), co jen ověří, že se
 * vůbec otevře a appka klik správně spustí — nedokončuje ho, ať test
 * není závislý na časování emulátorového handshake.
 */
export async function loginAs(page: Page, email: string) {
  const auth = getAuth(admin());
  let uid = email;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
  } catch {
    try {
      await auth.createUser({ uid, email });
    } catch {
      // Souběžný test (jiný worker) mezitím stihl založit stejného
      // uživatele (oba testy klidně přihlašují stejný e-mail) — v
      // pořádku, jen ho doteď dohledáme.
      uid = (await auth.getUserByEmail(email)).uid;
    }
  }
  const token = await auth.createCustomToken(uid);
  await page.goto(`/login-harness.html?token=${encodeURIComponent(token)}&redirect=/app`);
  await page.waitForURL(/\/app/, { timeout: 15_000 });
}

/**
 * Starý přístup přes skutečné popup okno — ponechaný pro jeden smoke
 * test tlačítka samotného (viz e2e/auth.spec.ts), ne pro běžné
 * přihlašování v ostatních testech (použij `loginAs` výše).
 */
export async function loginViaGooglePopup(page: Page, email: string) {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: /přihlásit se přes google/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();

  const addAccount = popup.getByText("Add new account");
  if (await addAccount.isVisible().catch(() => false)) {
    await addAccount.click();
  }

  // Auth emulátor má na #email-input nefunkční aria-labelledby (ukazuje
  // na neexistující id), takže getByLabel nenajde přístupné jméno —
  // cílíme rovnou na ID.
  await popup.locator("#email-input").fill(email);
  await popup.getByRole("button", { name: /sign in with google\.com/i }).click();

  // Popup se po dokončení přihlášení zavírá sám (appka na hlavní stránce
  // ho zavře, jakmile zpracuje výsledek) — nečekáme na to napevno tady,
  // stačí to, na co čeká volající (přesměrování/text na hlavní stránce)
  // s dostatečně dlouhým timeoutem, protože handshake přes emulátorové
  // "iframe relay" bývá o pár vteřin pomalejší než opravdové Google
  // přihlášení.
}
