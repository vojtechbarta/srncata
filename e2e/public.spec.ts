import { test, expect } from "@playwright/test";
import { PUBLISHED_POST_SLUG } from "./global-setup";

test("domovská stránka se načte a nabízí přihlášení pilotů", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /přihlášení pilotů/i })).toBeVisible();
});

test("tým: karty jdou otevřít a bio se zobrazí v modalu", async ({ page }) => {
  await page.goto("/tym");
  await page.getByRole("button", { name: "Markéta Káňová" }).click();
  await expect(page.getByRole("dialog")).toContainText("Zakladatelka spolku");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("blog: seznam ukáže jen zveřejněné příspěvky a detail se otevře", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("link", { name: /testovací zveřejněný příspěvek/i })).toBeVisible();

  await page.getByRole("link", { name: /testovací zveřejněný příspěvek/i }).click();
  await expect(page).toHaveURL(new RegExp(`/blog/${PUBLISHED_POST_SLUG}$`));
  await expect(page.getByRole("heading", { name: "Testovací zveřejněný příspěvek" })).toBeVisible();
  await expect(page.getByText("První odstavec příspěvku.")).toBeVisible();
});

test("blog: neexistující adresa ukáže „nenalezen“, ne prázdnou appku", async ({ page }) => {
  await page.goto("/blog/tohle-neexistuje");
  await expect(page.getByText(/příspěvek nenalezen/i)).toBeVisible();
});

test("kontakt: odkaz na Instagram vede na profil spolku, ne na obecnou hlavní stránku", async ({ page }) => {
  await page.goto("/kontakt");
  const instagram = page.getByRole("link", { name: "Instagram" });
  await expect(instagram).toHaveAttribute("href", "https://www.instagram.com/zachran_srnce_msk");
});

test("dostupnost: kalendář se vykreslí a jde na aktuálním měsíci vrátit zpátky jen dozadu", async ({ page }) => {
  await page.goto("/dostupnost");
  await expect(page.getByRole("heading", { name: /máme volný termín/i })).toBeVisible();
  // Bez spočítané dostupnosti (žádná akce v e2e fixtures dostupnost
  // nepočítala) appka na to upozorní, ne že by tvářila prázdný kalendář
  // za spočítaný.
  await expect(page.getByText(/ještě nemáme dostupnost spočítanou/i)).toBeVisible();
  // Na aktuálním měsíci nejde jít o měsíc zpátky.
  await expect(page.getByRole("button", { name: /předchozí měsíc/i })).toBeDisabled();
});
