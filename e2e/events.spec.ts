import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL, CONFIRMED_EVENT_ID } from "./global-setup";

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
});

test("založení nové akce se uloží a objeví v seznamu", async ({ page }) => {
  const name = `E2E nová akce ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await expect(page.getByRole("heading", { name: "Nová akce" })).toBeVisible();

  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2026-10-15T08:00");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page).toHaveURL(/\/app\/akce$/);
  await expect(page.getByText(name)).toBeVisible();
});

test("bez vyplněného času zahájení appka neuloží (povinné pole)", async ({ page }) => {
  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill("Akce bez data");
  await page.getByRole("button", { name: "Uložit" }).click();

  // HTML5 required na "Čas zahájení" zablokuje odeslání formuláře úplně
  // — appka zůstává na "Nová akce", žádný zápis do Firestore neproběhl.
  await expect(page).toHaveURL(/\/app\/akce\/nova$/);
  await expect(page.getByRole("heading", { name: "Nová akce" })).toBeVisible();
});

test("úprava existující akce uloží změnu názvu", async ({ page }) => {
  // Vlastní, jednorázová akce místo sdílené fixture (EVENT_WITH_FIELD_ID
  // používá i event-export.spec.ts) — ať testy na sobě nezávisí, i když
  // běží souběžně v jiném workeru.
  const originalName = `E2E k úpravě ${Date.now()}`;
  const newName = `${originalName} (upraveno)`;

  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(originalName);
  await page.locator('input[type="datetime-local"]').fill("2026-10-16T08:00");
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(page.getByText(originalName)).toBeVisible();

  await page.getByText(originalName).click();
  await expect(page.getByPlaceholder(/louka za hošťálkovicemi/i)).toHaveValue(originalName);
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(newName);
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page).toHaveURL(/\/app\/akce$/);
  await expect(page.getByText(newName, { exact: true })).toBeVisible();
});

test("koncept jde smazat po potvrzení", async ({ page }) => {
  const name = `E2E ke smazání ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2026-10-20T08:00");
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(page.getByText(name)).toBeVisible();

  await page.getByText(name).click();
  await page.getByRole("button", { name: /^smazat akci$/i }).click();
  await page.getByRole("button", { name: /^smazat$/i }).click();

  await expect(page).toHaveURL(/\/app\/akce$/);
  await expect(page.getByText(name)).toBeHidden();
});

test("potvrzenou akci appka nenabídne ke smazání", async ({ page }) => {
  await page.goto(`/app/akce/${CONFIRMED_EVENT_ID}`);
  await expect(page.getByRole("button", { name: /^smazat akci$/i })).toHaveCount(0);
  await expect(page.getByText(/nejdřív ji zrušte/i)).toBeVisible();
});

test("seznam akcí: filtr podle stavu ukáže jen odpovídající akce", async ({ page }) => {
  await page.goto("/app/akce");
  await page.getByRole("button", { name: /^potvrzeno/i }).click();
  await expect(page.getByText("Potvrzená akce pro e2e test")).toBeVisible();
  await expect(page.getByText("Louka pro e2e test exportu")).toBeHidden();
});

test("přednáška pro školy: telefon se jmenuje 'Telefon škola', ne zemědělská pole", async ({ page }) => {
  const name = `E2E přednáška ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByRole("button", { name: "Přednáška pro školy" }).click();

  // U přednášky appka schová zemědělská/mysliveckou agendu, stejně jako
  // u "Jiný výjezd" — viz EventKind v src/lib/types.ts.
  await expect(page.getByText("Rozloha pole (ha)")).toBeHidden();
  await expect(page.getByText("Kontakt na myslivce")).toBeHidden();
  await expect(page.getByText("Telefon na koordinátora")).toBeHidden();

  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2026-10-18T09:00");
  await page.getByPlaceholder(/zš hošťálkovice/i).fill("ZŠ Testovací");
  await page.getByLabel("Telefon škola").fill("+420600123456");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page).toHaveURL(/\/app\/akce$/);
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText("Přednáška pro školy")).toBeVisible();

  await page.getByText(name).click();
  await expect(page.getByPlaceholder(/zš hošťálkovice/i)).toHaveValue("ZŠ Testovací");
  await expect(page.getByLabel("Telefon škola")).toHaveValue("+420600123456");
});
