import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { ADMIN_EMAIL, EXISTING_SLUG_FOR_COLLISION } from "./global-setup";

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await loginAs(page, ADMIN_EMAIL);
  await page.goto("/app/blog/nova");
});

test("titulek bez latinky/čísel (jen emoji) ukáže chybu místo pádu na prázdném slugu", async ({ page }) => {
  await page.getByPlaceholder(/jak dopadla letošní senoseč/i).fill("🦌🚁🌾");
  await page.getByPlaceholder(/odstavce odděl/i).fill("Obsah příspěvku pro test.");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page.getByText(/z titulku nejde vytvořit adresu/i)).toBeVisible();
  // Neodešlo se na appku ani na chybu z Firestore — pořád jsme na formuláři.
  await expect(page).toHaveURL(/\/app\/blog\/nova$/);
});

test("adresa, co už existuje, se odmítne se srozumitelnou chybou (ne tichým přepsáním)", async ({ page }) => {
  await page.getByPlaceholder(/jak dopadla letošní senoseč/i).fill("Nový titulek se starou adresou");
  // Adresa (slug) — ručně přepsat na už existující, appka ji jinak
  // odvodí z titulku sama.
  const slugInput = page.getByPlaceholder("jak-dopadla-letosni-senosec");
  await slugInput.fill(EXISTING_SLUG_FOR_COLLISION);
  await page.getByPlaceholder(/odstavce odděl/i).fill("Obsah.");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page.getByText(new RegExp(`"${EXISTING_SLUG_FOR_COLLISION}".*už existuje`, "i"))).toBeVisible();
  await expect(page).toHaveURL(/\/app\/blog\/nova$/);
});

test("nový příspěvek s unikátní adresou se založí a objeví v seznamu", async ({ page }) => {
  const title = `E2E testovací příspěvek ${Date.now()}`;
  await page.getByPlaceholder(/jak dopadla letošní senoseč/i).fill(title);
  await page.getByPlaceholder(/odstavce odděl/i).fill("Obsah nového příspěvku.");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page).toHaveURL(/\/app\/blog$/);
  await expect(page.getByText(title)).toBeVisible();
});
