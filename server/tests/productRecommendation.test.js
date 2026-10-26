const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/product.model");
const Order = require("../src/models/order.model");
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

describe("Smart Product Recommendation Engine", () => {
  let restaurantToken;
  let restaurant2Token;
  let supplierToken;
  let milkProduct;
  let cheeseProduct;
  let butterProduct;
  let outOfStockCream;
  let exoticHerbProduct;
  let exoticSpiceProduct;

  beforeEach(async () => {
    // 1. Register and login Restaurant 1
    await request(app).post("/api/auth/register").send({
      name: "Chef Table",
      email: "cheftable@restaurant.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r1Login = await request(app).post("/api/auth/login").send({
      email: "cheftable@restaurant.com",
      password: "Password123!",
    });
    restaurantToken = r1Login.body.token;

    // 2. Register and login Restaurant 2 (for data isolation tests)
    await request(app).post("/api/auth/register").send({
      name: "Secret Kitchen",
      email: "secret@restaurant.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r2Login = await request(app).post("/api/auth/login").send({
      email: "secret@restaurant.com",
      password: "Password123!",
    });
    restaurant2Token = r2Login.body.token;

    // 3. Register and login Supplier
    await request(app).post("/api/auth/register").send({
      name: "Valley Dairy & Spices",
      email: "valley@supplier.com",
      password: "Password123!",
      role: "supplier",
    });
    const sLogin = await request(app).post("/api/auth/login").send({
      email: "valley@supplier.com",
      password: "Password123!",
    });
    supplierToken = sLogin.body.token;
    const supplierId = sLogin.body.user.id;

    // 4. Create Catalogue of Products
    milkProduct = await Product.create({
      supplier: supplierId,
      name: "Fresh Whole Milk",
      category: "Dairy",
      unit: "L",
      price: 50,
      stock: 200,
    });

    cheeseProduct = await Product.create({
      supplier: supplierId,
      name: "Cheddar Cheese",
      category: "Dairy",
      unit: "kg",
      price: 350,
      stock: 40,
    });

    butterProduct = await Product.create({
      supplier: supplierId,
      name: "Salted Butter",
      category: "Dairy",
      unit: "kg",
      price: 250,
      stock: 50,
    });

    // Out-of-stock complementary product
    outOfStockCream = await Product.create({
      supplier: supplierId,
      name: "Heavy Whipping Cream",
      category: "Dairy",
      unit: "L",
      price: 180,
      stock: 0,
    });

    // Unrelated exotic category items (no explicit rule)
    exoticHerbProduct = await Product.create({
      supplier: supplierId,
      name: "Lemongrass Stalks",
      category: "Exotic Herbs",
      unit: "kg",
      price: 120,
      stock: 15,
    });

    exoticSpiceProduct = await Product.create({
      supplier: supplierId,
      name: "Kaffir Lime Leaves",
      category: "Exotic Herbs",
      unit: "Pack",
      price: 90,
      stock: 25,
    });
  });

  test("suggests configured complementary products for a target item (Milk -> Cheese, Butter)", async () => {
    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.target.name.toLowerCase()).toContain("milk");
    expect(res.body.basis).toBe("complementary");
    expect(res.body.recommendations.length).toBeGreaterThan(0);

    const names = res.body.recommendations.map((p) => p.name.toLowerCase());
    expect(names.some((name) => name.includes("cheese") || name.includes("butter"))).toBe(true);
  });

  test("never recommends out-of-stock items (stock = 0)", async () => {
    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    const recommendedIds = res.body.recommendations.map((p) => p._id.toString());

    // Heavy Whipping Cream has stock = 0 and must not be recommended
    expect(recommendedIds).not.toContain(outOfStockCream._id.toString());

    // All recommended listings must have stock > 0
    res.body.recommendations.forEach((item) => {
      expect(item.stock).toBeGreaterThan(0);
    });
  });

  test("falls back to related categories when no direct complementary rule matches", async () => {
    const res = await request(app)
      .get(`/api/products/${exoticHerbProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.basis).toBe("category_fallback");
    expect(res.body.recommendations.length).toBeGreaterThan(0);

    const names = res.body.recommendations.map((p) => p.name.toLowerCase());
    expect(names.some((name) => name.includes("kaffir"))).toBe(true);
    expect(names.some((name) => name.includes("lemongrass"))).toBe(false);
  });

  test("gracefully falls back when purchase history is completely empty", async () => {
    await Order.deleteMany({});

    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  test("identifies genuine co-purchases from valid historical orders", async () => {
    await Order.create([
      {
        rfq: "650000000000000000000010",
        quotation: "650000000000000000000011",
        restaurant: "650000000000000000000099",
        supplier: milkProduct.supplier,
        product: milkProduct._id,
        productName: milkProduct.name,
        unit: "L",
        quantity: 20,
        agreedPrice: 50,
        totalAmount: 1000,
        orderStatus: "delivered",
        paymentStatus: "paid",
      },
      {
        rfq: "650000000000000000000010",
        quotation: "650000000000000000000012",
        restaurant: "650000000000000000000099",
        supplier: exoticHerbProduct.supplier,
        product: exoticHerbProduct._id,
        productName: exoticHerbProduct.name,
        unit: "kg",
        quantity: 5,
        agreedPrice: 120,
        totalAmount: 600,
        orderStatus: "delivered",
        paymentStatus: "paid",
      },
    ]);

    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  test("enforces restaurant data isolation (never exposes other restaurants' order IDs or data)", async () => {
    await Order.create({
      rfq: "650000000000000000000020",
      quotation: "650000000000000000000021",
      restaurant: "650000000000000000000077",
      supplier: milkProduct.supplier,
      product: milkProduct._id,
      productName: milkProduct.name,
      unit: "L",
      quantity: 5,
      agreedPrice: 50,
      totalAmount: 250,
      orderStatus: "delivered",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    const rawJson = JSON.stringify(res.body);

    expect(rawJson).not.toContain("650000000000000000000077");
    expect(rawJson).not.toContain("650000000000000000000020");
  });

  test("rejects invalid MongoDB ObjectId with status 400", async () => {
    const res = await request(app)
      .get("/api/products/invalid-id-format/recommendations")
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid product id/i);
  });

  test("returns 404 for non-existent product ID", async () => {
    const nonExistentId = "650000000000000000000044";
    const res = await request(app)
      .get(`/api/products/${nonExistentId}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  test("enforces authentication and restaurant role authorization", async () => {
    // 1. No token -> 401
    const noTokenRes = await request(app).get(
      `/api/products/${milkProduct._id}/recommendations`
    );
    expect(noTokenRes.status).toBe(401);

    // 2. Supplier role -> 403 Forbidden
    const supplierRes = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${supplierToken}`);
    expect(supplierRes.status).toBe(403);
  });

  test("supports contextual search queries via /api/products/recommendations?query=Bread", async () => {
    const res = await request(app)
      .get("/api/products/recommendations?query=bread")
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.recommendations.map((p) => p.name.toLowerCase());
    expect(names.some((name) => name.includes("butter") || name.includes("cheese"))).toBe(true);
  });

  test("deduplicates results so recommendations provide distinct product items", async () => {
    await Product.create({
      supplier: milkProduct.supplier,
      name: "Cheddar Cheese",
      category: "Dairy",
      unit: "kg",
      price: 340,
      stock: 20,
    });

    const res = await request(app)
      .get(`/api/products/${milkProduct._id}/recommendations`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    const names = res.body.recommendations.map((p) => p.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  test("dedicated route /api/recommendations also operates with same security and results", async () => {
    const res = await request(app)
      .get(`/api/recommendations/${milkProduct._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });
});
