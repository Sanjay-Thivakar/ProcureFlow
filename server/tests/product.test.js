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

describe("Product Creation & Updates", () => {
  let supplierToken;
  let supplier2Token;
  let restaurantToken;

  beforeEach(async () => {
    // Register & login supplier 1
    await request(app).post("/api/auth/register").send({
      name: "Supplier One",
      email: "supplier1@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s1Res = await request(app).post("/api/auth/login").send({
      email: "supplier1@test.com",
      password: "Password123!",
    });
    supplierToken = s1Res.body.token;

    // Register & login supplier 2
    await request(app).post("/api/auth/register").send({
      name: "Supplier Two",
      email: "supplier2@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s2Res = await request(app).post("/api/auth/login").send({
      email: "supplier2@test.com",
      password: "Password123!",
    });
    supplier2Token = s2Res.body.token;

    // Register & login restaurant
    await request(app).post("/api/auth/register").send({
      name: "Burger Place",
      email: "restaurant@test.com",
      password: "Password123!",
      role: "restaurant",
    });
    const rRes = await request(app).post("/api/auth/login").send({
      email: "restaurant@test.com",
      password: "Password123!",
    });
    restaurantToken = rRes.body.token;
  });

  test("supplier can create a valid product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        name: "Organic Tomatoes",
        category: "Vegetables",
        unit: "kg",
        price: 45,
        stock: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe("Organic tomatoes");
    expect(res.body.product.price).toBe(45);
    expect(res.body.product.stock).toBe(100);
  });

  test("restaurant cannot create products", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        name: "Forbidden Item",
        category: "Test",
        unit: "kg",
        price: 10,
        stock: 50,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("rejects product creation with negative price or stock", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        name: "Negative Price Item",
        category: "Test",
        unit: "kg",
        price: -5,
        stock: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("restricts product updates to explicitly allowed fields and blocks mass assignment", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        name: "Red Apples",
        category: "Fruits",
        unit: "kg",
        price: 80,
        stock: 50,
      });

    const productId = created.body.product._id;
    const originalSupplier = created.body.product.supplier;

    // Attempt to update price and stock, and try injecting a forged supplier ID
    const updateRes = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        price: 95,
        stock: 75,
        supplier: "650000000000000000000099", // Attempt mass assignment
        forgedField: "hacked",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.product.price).toBe(95);
    expect(updateRes.body.product.stock).toBe(75);
    // Ensure supplier ownership was NOT changed to forged value
    expect(updateRes.body.product.supplier._id.toString()).toBe(originalSupplier.toString());
    expect(updateRes.body.product.forgedField).toBeUndefined();
  });

  test("non-owner supplier cannot update another supplier's product", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        name: "Fresh Milk",
        category: "Dairy",
        unit: "L",
        price: 60,
        stock: 30,
      });

    const productId = created.body.product._id;

    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${supplier2Token}`)
      .send({ price: 70 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("non-owner supplier cannot delete another supplier's product", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplierToken}`)
      .send({
        name: "Fresh Milk",
        category: "Dairy",
        unit: "L",
        price: 60,
        stock: 30,
      });

    const productId = created.body.product._id;

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${supplier2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
