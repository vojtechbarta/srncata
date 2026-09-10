import { test, expect } from "@playwright/test";
import { loginAs, loginViaGooglePopup } from "./helpers/auth";
import { ADMIN_EMAIL } from "./global-setup";

test("přihlašovací tlačítko otevře skutečné Google (emulátor) okno", async ({ page }) => {
  // Smoke test samotného UI tlačítka/popup okna — nedokončuje přihlášení
  // (to dělá loginAs přes login-harness.html ve zbytku testů, viz jeho
  // komentář), jen ověří, že appka klik na "Přihlásit se přes Google"
  // opravdu předá dál do Firebase Auth a otevře se očekávaný formulář.
  await page.goto("/app");
  await loginViaGooglePopup(page, ADMIN_EMAIL);
});

test("přihlášení pustí do /app/akce, hlavičku appky vidí jen přihlášený tým", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Přihlášení pilotů" })).toBeVisible();

  await loginAs(page, ADMIN_EMAIL);

  await expect(page).toHaveURL(/\/app\/akce$/);
  await expect(page.getByRole("heading", { name: "Akce" })).toBeVisible();
});

test("neznámý e-mail (není v týmu) vidí zprávu, ne appku", async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, "clovek-mimo-tym@gmail.com");

  await expect(page.getByText(/není v týmu/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /zkusit jiný účet/i })).toBeVisible();
});

test("mobilní menu appky: hamburger se rozbalí a schová po přechodu na jinou stránku", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/app\/akce$/);

  // Na mobilní šířce je vodorovné menu schované a místo něj je hamburger.
  await expect(page.getByRole("link", { name: "Piloti" })).toBeHidden();
  await page.getByRole("button", { name: /otevřít menu/i }).click();
  await expect(page.getByRole("link", { name: "Piloti" })).toBeVisible();

  await page.getByRole("link", { name: "Piloti" }).click();
  await expect(page).toHaveURL(/\/app\/piloti$/);
  // Menu se po přechodu na jinou stránku samo zavře.
  await expect(page.getByRole("link", { name: "Drony" })).toBeHidden();
});
