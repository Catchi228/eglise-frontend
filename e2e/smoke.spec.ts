import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const testEmail = `e2e-${Date.now()}@cbdtogo.org`;
const testPassword = "testpass123";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cbdtogo.org";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

const jsonHeaders = {
  "content-type": "application/json",
  Origin: base,
  Referer: `${base}/connexion`,
};

test.describe("Parcours production", () => {
  test("accueil et annonces publics", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Navigation principale")).toBeVisible();
    await page.goto("/annonces");
    await expect(page.getByRole("heading", { name: "Annonces" })).toBeVisible();
  });

  test("cours redirige vers connexion sans session", async ({ page }) => {
    await page.goto("/cours", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/connexion/, { timeout: 10_000 });
  });

  test("inscription et accès cours", async ({ page }) => {
    const reg = await page.request.post("/api/auth/register", {
      headers: jsonHeaders,
      data: { email: testEmail, password: testPassword },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/cours");
    await expect(page).toHaveURL(/\/cours/);
    await expect(page.getByRole("heading", { name: "Cours & documents" })).toBeVisible();
  });

  test("API protège les cours sans auth", async ({ request }) => {
    const res = await request.get("/api/courses");
    expect(res.status()).toBe(401);
  });

  test("admin connexion et tableau de bord", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/connexion");
    await page.getByPlaceholder("ex: nom@cbdtogo.org").fill(adminEmail);
    await page.getByPlaceholder("••••").fill(adminPassword);
    await page.getByRole("button", { name: /accéder à l.administration/i }).click();
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/admin\/connexion/);
    await expect(
      page.getByRole("link", { name: "Annonces", exact: true }).first(),
    ).toBeVisible({ timeout: 25_000 });
  });

  test("viewport mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
