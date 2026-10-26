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

describe("RFQ Creation & Detail Access Control", () => {
  let restaurant1Token;
  let restaurant2Token;
  let supplier1Token;
  let supplier2Token;
  let outsiderSupplierToken;
  let product1Id;
  let product2Id;
  let mismatchedProductId;

  beforeEach(async () => {
    // Restaurant 1
    await request(app).post("/api/auth/register").send({
      name: "Restaurant Alpha",
      email: "alpha@rest.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r1 = await request(app).post("/api/auth/login").send({
      email: "alpha@rest.com",
      password: "Password123!",
    });
    restaurant1Token = r1.body.token;

    // Restaurant 2
    await request(app).post("/api/auth/register").send({
      name: "Restaurant Beta",
      email: "beta@rest.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r2 = await request(app).post("/api/auth/login").send({
      email: "beta@rest.com",
      password: "Password123!",
    });
    restaurant2Token = r2.body.token;

    // Supplier 1
    await request(app).post("/api/auth/register").send({
      name: "Supplier A",
      email: "suppa@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s1 = await request(app).post("/api/auth/login").send({
      email: "suppa@test.com",
      password: "Password123!",
    });
    supplier1Token = s1.body.token;

    // Supplier 2
    await request(app).post("/api/auth/register").send({
      name: "Supplier B",
      email: "suppb@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s2 = await request(app).post("/api/auth/login").send({
      email: "suppb@test.com",
      password: "Password123!",
    });
    supplier2Token = s2.body.token;

    // Outsider Supplier
    await request(app).post("/api/auth/register").send({
      name: "Supplier Outsider",
      email: "outsider@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s3 = await request(app).post("/api/auth/login").send({
      email: "outsider@test.com",
      password: "Password123!",
    });
    outsiderSupplierToken = s3.body.token;

    // Create products: Supplier A and B offer Onions (same name and unit)
    const p1 = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        name: "Onions",
        category: "Vegetables",
        unit: "kg",
        price: 30,
        stock: 500,
      });
    product1Id = p1.body.product._id;

    const p2 = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplier2Token}`)
      .send({
        name: "Onions",
        category: "Vegetables",
        unit: "kg",
        price: 32,
        stock: 400,
      });
    product2Id = p2.body.product._id;

    // Mismatched product (Potatoes)
    const p3 = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        name: "Potatoes",
        category: "Vegetables",
        unit: "kg",
        price: 25,
        stock: 200,
      });
    mismatchedProductId = p3.body.product._id;
  });

  test("restaurant can create RFQ comparing multiple suppliers for same item", async () => {
    const res = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurant1Token}`)
      .send({
        productListings: [product1Id, product2Id],
        quantity: 50,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
        message: "Need 50kg fresh onions tomorrow",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.rfq).toBeDefined();
    expect(res.body.rfq.productName).toBe("Onions");
    expect(res.body.rfq.productListings).toHaveLength(2);
  });

  test("rejects RFQ creation when selected products represent different items", async () => {
    const res = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurant1Token}`)
      .send({
        productListings: [product1Id, mismatchedProductId],
        quantity: 50,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
        message: "Mismatched items",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/must represent the same item/i);
  });

  test("supplier cannot create RFQ", async () => {
    const res = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        productListings: [product1Id],
        quantity: 10,
        requiredBy: new Date().toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("ownership and access control on getRFQDetails", async () => {
    const createdRFQ = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurant1Token}`)
      .send({
        productListings: [product1Id, product2Id],
        quantity: 50,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });

    const rfqId = createdRFQ.body.rfq._id;

    // 1. Restaurant owner can view RFQ and all quotations
    const ownerRes = await request(app)
      .get(`/api/rfqs/${rfqId}`)
      .set("Authorization", `Bearer ${restaurant1Token}`);
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.rfq._id).toBe(rfqId);
    expect(ownerRes.body.quotations).toHaveLength(2);

    // 2. Another restaurant cannot view this RFQ (403 Forbidden)
    const otherRestRes = await request(app)
      .get(`/api/rfqs/${rfqId}`)
      .set("Authorization", `Bearer ${restaurant2Token}`);
    expect(otherRestRes.status).toBe(403);

    // 3. Participating supplier 1 can view, but ONLY sees their own quotation
    const supp1Res = await request(app)
      .get(`/api/rfqs/${rfqId}`)
      .set("Authorization", `Bearer ${supplier1Token}`);
    expect(supp1Res.status).toBe(200);
    expect(supp1Res.body.quotations).toHaveLength(1);
    expect(supp1Res.body.quotations[0].supplier.email).toBe("suppa@test.com");

    // 4. Outsider supplier cannot view this RFQ (403 Forbidden)
    const outsiderRes = await request(app)
      .get(`/api/rfqs/${rfqId}`)
      .set("Authorization", `Bearer ${outsiderSupplierToken}`);
    expect(outsiderRes.status).toBe(403);
  });
});
