import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL } from "./global-setup";

// Karty pilotů jsou sourozenci ve společném seznamu (viz PilotsPage) —
// locator na "div, co obsahuje tenhle nadpis" by bez dalšího zúžení
// nejsnáz našel celý obalující seznam (obsahuje všechny karty), ne
// jednu konkrétní. `.rounded-2xl` je třída, kterou má jen kořenový div
// samotné PilotCard (viz PilotCard.tsx), takže spolehlivě vybere jen
// tu jednu kartu.
function pilotCard(page: Page, name: string) {
  return page.locator("div.rounded-2xl", { has: page.getByRole("heading", { name, exact: true }) });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
  await page.goto("/app/piloti");
});

test("pilota, co drží dron, nejde smazat — appka ukáže jen upozornění", async ({ page }) => {
  const card = pilotCard(page, "Držitel Dronu");
  await expect(card.getByText(/nejde odebrat z týmu/i)).toBeVisible();
  await expect(card.getByText(/Dron 1/)).toBeVisible();
  await expect(card.getByRole("button", { name: /odebrat z týmu/i })).toHaveCount(0);
});

test("smazání vlastního účtu zdůrazní, že si tím admin zavře vlastní přístup", async ({ page }) => {
  const card = pilotCard(page, "Admin Testovací");
  await card.getByRole("button", { name: /^odebrat z týmu$/i }).click();
  await expect(card.getByText(/tohle je váš vlastní přístup/i)).toBeVisible();
  await expect(card.getByRole("button", { name: /ano, odebrat i sebe/i })).toBeVisible();
  // Nemazat doopravdy — jen ověřujeme text upozornění.
  await card.getByRole("button", { name: /^zrušit$/i }).click();
});

test("pilota bez vybavení a jiného než přihlášeného smí admin smazat po potvrzení", async ({ page }) => {
  await page.getByPlaceholder("Jméno").fill("Dočasný Testovací Pilot");
  await page.getByPlaceholder("E-mail (gmail)").fill(`playwright-throwaway-${Date.now()}@gmail.com`);
  await page.getByRole("button", { name: "Přidat pilota" }).click();

  const card = pilotCard(page, "Dočasný Testovací Pilot");
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: /^odebrat z týmu$/i }).click();
  await expect(card.getByText(/opravdu odebrat z týmu/i)).toBeVisible();
  await card.getByRole("button", { name: /^odebrat$/i }).click();

  await expect(page.getByRole("heading", { name: "Dočasný Testovací Pilot" })).toBeHidden();
});

test("e-mail nového pilota se uloží normalizovaný na malá písmena", async ({ page }) => {
  const email = `Playwright.Case.${Date.now()}@Gmail.com`;
  await page.getByPlaceholder("Jméno").fill("Velké Písmeno");
  await page.getByPlaceholder("E-mail (gmail)").fill(email);
  await page.getByRole("button", { name: "Přidat pilota" }).click();

  const card = pilotCard(page, "Velké Písmeno");
  await expect(card.getByRole("link", { name: email.toLowerCase() })).toBeVisible();

  // Uklidit po sobě — jen tenhle vlastní nový pilot, nic sdíleného.
  await card.getByRole("button", { name: /^odebrat z týmu$/i }).click();
  await card.getByRole("button", { name: /^odebrat$/i }).click();
});

test("neplatný e-mail se odmítne se srozumitelnou chybou", async ({ page }) => {
  await page.getByPlaceholder("Jméno").fill("Neplatný Email");
  await page.getByPlaceholder("E-mail (gmail)").fill("neni-to-email");
  await page.getByRole("button", { name: "Přidat pilota" }).click();

  await expect(page.getByText(/nevypadá jako platný e-mail/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Neplatný Email" })).toBeHidden();
});
