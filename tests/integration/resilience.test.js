const request = require("supertest");
const app = require("../../server");
const db = require("../../src/db");

afterAll(() => db.destroy());

// regression: blank JWT_SECRET used to crash the process mid-register, leaving a ghost user row
describe("async route errors do not crash the process", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  test("register returns 500 (not a crash) when JWT_SECRET is missing, and the process stays up", async () => {
    process.env.JWT_SECRET = "";

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Resilience Test", email: "resilience@example.com", password: "Passw0rd1" });

    expect(res.status).toBe(500);

    // process still alive + db still works = caught, not crashed
    const health = await request(app).get("/api/services");
    expect(health.status).toBe(200);
  });

  test("login returns 500 (not a crash) when JWT_SECRET is missing", async () => {
    process.env.JWT_SECRET = originalSecret;
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Resilience Login", email: "resilience.login@example.com", password: "Passw0rd1" });

    process.env.JWT_SECRET = "";
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "resilience.login@example.com", password: "Passw0rd1" });

    expect(res.status).toBe(500);
  });
});
