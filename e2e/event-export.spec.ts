import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL, EVENT_WITH_FIELD_ID } from "./global-setup";

// Regresní test pro nález "Rychlost letu v exportu pro DJI Pilot 2 se
// nekontroluje vůbec" — appka dřív nechala export s nulovou/zápornou
// rychlostí projít, protože exportní tlačítka nejedou přes odeslání
// formuláře (type="button"), takže na ně HTML5 validace inputu vůbec
// nedosáhne.
test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
  await page.goto(`/app/akce/${EVENT_WITH_FIELD_ID}`);
  await expect(page.getByText(/nastavení letu pro export/i)).toBeVisible();
});

test("export je ve výchozím stavu (60 m, 4 m/s) povolený", async ({ page }) => {
  await expect(page.getByRole("button", { name: /stáhnout vše/i })).toBeEnabled();
});

test("nulová nebo záporná rychlost export zamkne a appka ukáže proč", async ({ page }) => {
  const speed = page.getByLabel("rychlost (m/s)");
  const exportAll = page.getByRole("button", { name: /stáhnout vše/i });

  await speed.fill("0");
  await expect(page.getByText(/rychlost letu musí být/i)).toBeVisible();
  await expect(exportAll).toBeDisabled();

  await speed.fill("-5");
  await expect(page.getByText(/rychlost letu musí být/i)).toBeVisible();
  await expect(exportAll).toBeDisabled();

  await speed.fill("5");
  await expect(page.getByText(/rychlost letu musí být/i)).toBeHidden();
  await expect(exportAll).toBeEnabled();
});

test("výška mimo 10–120 m export zamkne", async ({ page }) => {
  const height = page.getByLabel("výška (m)");
  const exportAll = page.getByRole("button", { name: /stáhnout vše/i });

  await height.fill("999");
  await expect(page.getByText(/výška letu musí být/i)).toBeVisible();
  await expect(exportAll).toBeDisabled();

  await height.fill("60");
  await expect(page.getByText(/výška letu musí být/i)).toBeHidden();
  await expect(exportAll).toBeEnabled();
});
