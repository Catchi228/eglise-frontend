import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const jsonHeaders = {
  "content-type": "application/json",
  Origin: base,
  Referer: `${base}/connexion`,
};

test.describe("Contrats API (anonyme)", () => {
  test("endpoints sensibles refusent sans session", async ({ request }) => {
    const getPaths = [
      "/api/courses",
      "/api/qcm",
      "/api/admin/bootstrap",
      "/api/user/notes",
      "/api/user/performances",
      "/api/user/questions",
    ];
    for (const path of getPaths) {
      const res = await request.get(path);
      expect(res.status(), `GET ${path}`).toBe(401);
    }

    expect((await request.post("/api/presence/heartbeat")).status()).toBe(401);
  });

  test("bundle public et formulaire messages", async ({ request }) => {
    const bundle = await request.get("/api/public/bundle");
    expect(bundle.status()).toBe(200);
    const msg = await request.post("/api/messages", {
      headers: jsonHeaders,
      data: { from: `e2e-${Date.now()}@test.org`, body: "test e2e", subject: "E2E" },
    });
    expect(msg.status(), `POST /api/messages → ${msg.status()}`).toBe(200);
  });

  test("uploads admin requièrent session", async ({ request }) => {
    const pdf = await request.post("/api/uploads/pdf", {
      headers: { Origin: base },
      multipart: {
        file: {
          name: "x.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
      },
    });
    expect(pdf.status()).toBe(401);

    const img = await request.post("/api/uploads/image", {
      headers: { Origin: base },
      multipart: {
        file: {
          name: "x.png",
          mimeType: "image/png",
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        },
      },
    });
    expect(img.status()).toBe(401);
  });
});
