import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL } from "./global-setup";

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
});

// Pilot je jedinečný jen pro tenhle test (i mezi případnými retry —
// Date.now() v jméně, ne pevný text), ať se dá bezpečně ověřit i při
// souběžném běhu s ostatními testy proti stejnému emulátoru —
// nekontrolujeme absolutní součty na stránce (ty mohou obsahovat i akce
// z jiných testů/retry), jen řádek "podle pilota" patřící téhle
// konkrétní akci.
test("statistiky sečtou výsledky odlétané akce, koncept do nich nepočítají", async ({ page }) => {
  const name = `E2E statistiky ${Date.now()}`;
  const pilotName = `Admin Testovací ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2020-05-13T05:00");
  await page.getByLabel("Pilot").fill(pilotName);
  await page.getByLabel("Odchyceno srnčat").fill("2");
  await page.getByLabel("Vyhnáno srnčat").fill("3");
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(page).toHaveURL(/\/app\/akce$/);

  // Dokud je akce jen koncept, statistiky ji nepočítají (jen "done" akce mají výsledek).
  await page.goto("/app/statistiky");
  await expect(page.getByText(pilotName)).toBeHidden();

  // Přepnutí na Odlétáno je odemkne.
  await page.goto("/app/akce");
  await page.getByText(name).click();
  await page.getByRole("button", { name: "Odlétáno" }).click();
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(page).toHaveURL(/\/app\/akce$/);

  await page.goto("/app/statistiky");
  // `.flex.items-center.gap-3.text-sm` je třída jen na kořenovém divu
  // jednoho řádku BarRow (viz src/components/BarRow.tsx) — stejný trik
  // jako scoping karet jinde v e2e testech.
  const pilotRow = page.locator("div.flex.items-center.gap-3.text-sm", { hasText: pilotName });
  await expect(pilotRow.locator("span.font-mono-nums")).toHaveText("5");

  // Koláčový graf "Myslivci přítomni" — absolutní čísla se souběžnými
  // testy sdílet nedají, jen ověříme, že se vůbec vykreslí. Text obou
  // legend se liší jen předponou "Ne", getByText je bez `exact`
  // case-insensitive substring match — bez ukotvení na začátek by
  // "Přítomni:" našlo i uvnitř "Nepřítomni:".
  await expect(page.getByRole("heading", { name: "Myslivci přítomni" })).toBeVisible();
  await expect(page.getByText(/^Přítomni:/)).toBeVisible();
  await expect(page.getByText(/^Nepřítomni:/)).toBeVisible();
});

// Prosinec 2018 je datum, co žádný jiný e2e test nepoužívá — ať jde
// bezpečně ověřit hodnota v "Jiné akce" i při souběžném běhu s ostatními.
test("přednáška se počítá v sekci Jiné akce podle měsíce, ne v sekci Srnčata", async ({ page }) => {
  const name = `E2E přednáška statistiky ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByRole("button", { name: "Přednáška pro školy" }).click();
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2018-12-24T09:00");
  await page.getByRole("button", { name: "Odlétáno" }).click();
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(page).toHaveURL(/\/app\/akce$/);

  await page.goto("/app/statistiky");
  const monthRow = page.locator("div.flex.items-center.gap-3.text-sm", { hasText: "prosinec 2018" });
  await expect(monthRow.locator("span.font-mono-nums")).toHaveText("1");

  // Přednáška nemá caughtCount/chasedCount — v sekci Srnčata (byMonth) se
  // prosinec 2018 vůbec neobjeví.
  const fawnSection = page.locator("section", { hasText: "Srnčata" });
  await expect(fawnSection.getByText("prosinec 2018")).toBeHidden();
});
