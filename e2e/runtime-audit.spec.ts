import { test, expect } from "@playwright/test";

/** Pages publiques : document HTML attendu sans 404. */
const PUBLIC_PATHS = [
  "/",
  "/annonces",
  "/annonces/demande",
  "/connexion",
  "/bible",
  "/parametres",
  "/admin/connexion",
];

test.describe("Audit runtime", () => {
  test("pages publiques : pas de console error / pageerror, document ≠ 404", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[console] ${msg.text()}`);
    });
    page.on("pageerror", (err) => pageErrors.push(`[pageerror] ${err.message}`));

    const baseHost = process.env.PLAYWRIGHT_BASE_URL
      ? new URL(process.env.PLAYWRIGHT_BASE_URL).host
      : "localhost:3001";

    const notFoundSameOrigin: string[] = [];
    page.on("response", (resp) => {
      const u = resp.url();
      try {
        if (new URL(u).host !== baseHost) return;
      } catch {
        return;
      }
      const req = resp.request();
      const rt = req.resourceType();
      if (
        rt === "xhr" ||
        rt === "fetch" ||
        rt === "document" ||
        rt === "script" ||
        rt === "stylesheet"
      ) {
        if (resp.status() === 404) notFoundSameOrigin.push(`${rt} ${u}`);
      }
    });

    for (const path of PUBLIC_PATHS) {
      const resp = await page.goto(path, { waitUntil: "load" });
      expect(resp?.status(), `GET ${path}`).not.toBe(404);
    }

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
    expect(notFoundSameOrigin, notFoundSameOrigin.join("\n")).toEqual([]);
  });
});
