import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL } from "./global-setup";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PHOTO = path.join(__dirname, "fixtures", "test-photo.jpg");

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
});

test("nahrání, výběr náhledu a smazání fotky u akce", async ({ page }) => {
  // Vlastní jednorázová akce, ať test nezávisí na sdílených fixtures a
  // nenechává po sobě fotky ve Storage cizí akce.
  const name = `E2E fotky ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2026-10-25T08:00");
  await page.getByRole("button", { name: "Uložit" }).click();
  await page.getByText(name).click();

  await expect(page.getByRole("heading", { name: "Fotky", exact: true })).toBeVisible();
  await expect(page.getByText(/zatím žádné fotky/i)).toBeVisible();

  const fileInput = page.locator('input[type="file"]');

  // První fotka se automaticky stane náhledem (bez ručního výběru).
  await fileInput.setInputFiles(TEST_PHOTO);
  await expect(page.getByText(/nahrávám/i)).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText("★ Náhled")).toBeVisible();
  await expect(page.locator("img[src*=firebasestorage], img[src*='127.0.0.1']")).toHaveCount(1);

  // Druhá fotka nenahradí náhled sama od sebe.
  await fileInput.setInputFiles(TEST_PHOTO);
  await expect(page.getByText(/nahrávám/i)).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText("★ Náhled")).toHaveCount(1);
  await expect(page.getByText("☆ Nastavit")).toHaveCount(1);

  // Ruční přepnutí náhledu na druhou fotku.
  await page.getByText("☆ Nastavit").click();
  await expect(page.getByText("★ Náhled")).toHaveCount(1);
  await expect(page.getByText("☆ Nastavit")).toHaveCount(1);

  // Lightbox umí u více fotek procházet na další/předchozí, cyklicky.
  const thumbs = page.locator("img[src*=firebasestorage], img[src*='127.0.0.1']");
  await thumbs.first().click();
  const dialogImg = page.getByRole("dialog").locator("img");
  const firstSrc = await dialogImg.getAttribute("src");
  await page.getByRole("button", { name: "Další fotka" }).click();
  await expect(dialogImg).not.toHaveAttribute("src", firstSrc ?? "");
  await page.getByRole("button", { name: "Další fotka" }).click();
  await expect(dialogImg).toHaveAttribute("src", firstSrc ?? "");
  await page.getByRole("button", { name: "Předchozí fotka" }).click();
  await expect(dialogImg).not.toHaveAttribute("src", firstSrc ?? "");
  await page.getByRole("button", { name: "Zavřít" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  // Náhled se objeví i na kartě akce v seznamu. `.rounded-2xl` je třída
  // jen na kořenovém divu jedné karty (viz EventCard.tsx) — stejný trik
  // jako v pilots.spec.ts, ať se nenačte obalující seznam všech karet.
  await page.goto("/app/akce");
  const card = page.locator("div.rounded-2xl", { has: page.getByText(name, { exact: true }) });
  await expect(card.locator("img")).toHaveCount(1);

  // Smazání jedné fotky ji odebere z galerie.
  await page.getByText(name).click();
  await page.getByRole("button", { name: "Smazat fotku" }).first().click();
  await expect(page.locator("img[src*=firebasestorage], img[src*='127.0.0.1']")).toHaveCount(1);

  // U jediné zbylé fotky nemá procházení smysl — šipky se nezobrazí.
  await page.locator("img[src*=firebasestorage], img[src*='127.0.0.1']").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Další fotka" })).toBeHidden();
  await page.getByRole("button", { name: "Zavřít" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("odmítne příliš velký nebo neobrázkový soubor", async ({ page }) => {
  const name = `E2E fotky odmitnuti ${Date.now()}`;
  await page.goto("/app/akce/nova");
  await page.getByPlaceholder(/louka za hošťálkovicemi/i).fill(name);
  await page.locator('input[type="datetime-local"]').fill("2026-10-26T08:00");
  await page.getByRole("button", { name: "Uložit" }).click();
  await page.getByText(name).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "poznamky.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("tohle neni obrazek"),
  });

  await expect(page.getByText(/nahrání fotky se nepovedlo/i)).toBeVisible({ timeout: 10_000 });
});
