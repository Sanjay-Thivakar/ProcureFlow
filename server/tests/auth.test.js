const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./setup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Authentication & Role-Based Access Control", () => {
  const restaurantPayload = {
    name: "Tasty Bites",
    email: "tasty@bites.com",
    password: "Password123!",
    role: "restaurant",
  };

  const supplierPayload = {
    name: "Fresh Veggies Ltd",
    email: "fresh@veggies.com",
    password: "Password123!",
    role: "supplier",
  };

  test("should successfully register a restaurant and supplier", async () => {
    const resRest = await request(app)
      .post("/api/auth/register")
      .send(restaurantPayload);
    expect(resRest.status).toBe(201);
    expect(resRest.body.success).toBe(true);

    const resSupp = await request(app)
      .post("/api/auth/register")
      .send(supplierPayload);
    expect(resSupp.status).toBe(201);
    expect(resSupp.body.success).toBe(true);
  });

  test("should reject duplicate registration with same email", async () => {
    await request(app).post("/api/auth/register").send(restaurantPayload);

    const res = await request(app)
      .post("/api/auth/register")
      .send(restaurantPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test("should login successfully with valid credentials and return JWT token", async () => {
    await request(app).post("/api/auth/register").send(restaurantPayload);

    const res = await request(app).post("/api/auth/login").send({
      email: restaurantPayload.email,
      password: restaurantPayload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("restaurant");
    expect(res.body.user.password).toBeUndefined(); // ensure password hash is never returned
  });

  test("should reject login with wrong password", async () => {
    await request(app).post("/api/auth/register").send(restaurantPayload);

    const res = await request(app).post("/api/auth/login").send({
      email: restaurantPayload.email,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("should protect endpoints against unauthorized requests without token", async () => {
    const res = await request(app).get("/api/products/my-products");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should deny access when a restaurant tries to access supplier-only routes", async () => {
    await request(app).post("/api/auth/register").send(restaurantPayload);
    const loginRes = await request(app).post("/api/auth/login").send({
      email: restaurantPayload.email,
      password: restaurantPayload.password,
    });
    const token = loginRes.body.token;

    // Restaurant attempts to call supplier my-products
    const res = await request(app)
      .get("/api/products/my-products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
