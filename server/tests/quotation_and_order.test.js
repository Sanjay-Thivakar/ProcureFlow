const request = require("supertest");
const app = require("../src/app");
const Quotation = require("../src/models/quotation.model");
const Product = require("../src/models/product.model");
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

describe("Quotation Workflow, Order Confirmation & Stock Management", () => {
  let restaurantToken;
  let supplier1Token;
  let supplier2Token;
  let product1Id;
  let product2Id;

  beforeEach(async () => {
    // Restaurant
    await request(app).post("/api/auth/register").send({
      name: "Gourmet Bistro",
      email: "bistro@test.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r = await request(app).post("/api/auth/login").send({
      email: "bistro@test.com",
      password: "Password123!",
    });
    restaurantToken = r.body.token;

    // Supplier 1
    await request(app).post("/api/auth/register").send({
      name: "Cheese Supplier 1",
      email: "cheese1@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s1 = await request(app).post("/api/auth/login").send({
      email: "cheese1@test.com",
      password: "Password123!",
    });
    supplier1Token = s1.body.token;

    // Supplier 2
    await request(app).post("/api/auth/register").send({
      name: "Cheese Supplier 2",
      email: "cheese2@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s2 = await request(app).post("/api/auth/login").send({
      email: "cheese2@test.com",
      password: "Password123!",
    });
    supplier2Token = s2.body.token;

    // Create Mozzarella cheese products with initial stock
    const p1 = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        name: "Mozzarella Cheese",
        category: "Dairy",
        unit: "kg",
        price: 200,
        stock: 50,
      });
    product1Id = p1.body.product._id;

    const p2 = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${supplier2Token}`)
      .send({
        name: "Mozzarella Cheese",
        category: "Dairy",
        unit: "kg",
        price: 210,
        stock: 40,
      });
    product2Id = p2.body.product._id;
  });

  test("full quotation lifecycle: respond, reject, award, and auto-reject competing bids", async () => {
    // 1. Restaurant creates RFQ
    const rfqRes = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        productListings: [product1Id, product2Id],
        quantity: 20,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });
    const rfqId = rfqRes.body.rfq._id;

    // 2. Fetch quotations for supplier 1 & 2
    const supp1Quotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier1Token}`);
    const quote1 = supp1Quotes.body.quotations[0];

    const supp2Quotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier2Token}`);
    const quote2 = supp2Quotes.body.quotations[0];

    // 3. Both suppliers respond
    const respond1 = await request(app)
      .put(`/api/quotations/${quote1._id}/respond`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        quotedPrice: 190,
        discountPercentage: 5,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
        supplierNote: "Fresh batch available",
      });
    expect(respond1.status).toBe(200);
    expect(respond1.body.quotation.status).toBe("quoted");

    const respond2 = await request(app)
      .put(`/api/quotations/${quote2._id}/respond`)
      .set("Authorization", `Bearer ${supplier2Token}`)
      .send({
        quotedPrice: 195,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(respond2.status).toBe(200);

    // 4. Restaurant awards Supplier 1
    const awardRes = await request(app)
      .put(`/api/quotations/${quote1._id}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(awardRes.status).toBe(200);
    expect(awardRes.body.success).toBe(true);
    expect(awardRes.body.quotation.status).toBe("awarded");
    expect(awardRes.body.order).toBeDefined();
    expect(awardRes.body.order.orderStatus).toBe("pending_supplier_confirmation");

    // 5. Verify Supplier 2's quotation was automatically marked rejected
    const quote2Check = await Quotation.findById(quote2._id);
    expect(quote2Check.status).toBe("rejected");

    // 6. Verify cannot award another quotation on completed RFQ
    const doubleAwardRes = await request(app)
      .put(`/api/quotations/${quote2._id}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(doubleAwardRes.status).toBe(400);
  });

  test("rejects awarding an expired quotation", async () => {
    // Create RFQ
    await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        productListings: [product1Id],
        quantity: 10,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });

    const suppQuotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier1Token}`);
    const quote = suppQuotes.body.quotations[0];

    // Supplier responds
    await request(app)
      .put(`/api/quotations/${quote._id}/respond`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        quotedPrice: 180,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      });

    // Manually expire quotation
    await Quotation.findByIdAndUpdate(quote._id, {
      validUntil: new Date(Date.now() - 3600000), // 1 hour ago
    });

    // Restaurant tries to award expired quotation
    const res = await request(app)
      .put(`/api/quotations/${quote._id}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  test("order acceptance atomically checks and decrements stock", async () => {
    // Create RFQ for 30kg cheese (initial stock is 50kg)
    await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        productListings: [product1Id],
        quantity: 30,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });

    const suppQuotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier1Token}`);
    const quoteId = suppQuotes.body.quotations[0]._id;

    await request(app)
      .put(`/api/quotations/${quoteId}/respond`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        quotedPrice: 180,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      });

    const awardRes = await request(app)
      .put(`/api/quotations/${quoteId}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const orderId = awardRes.body.order._id;

    // Supplier accepts order
    const acceptRes = await request(app)
      .patch(`/api/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${supplier1Token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.order.orderStatus).toBe("confirmed");

    // Stock should now be 50 - 30 = 20kg
    const product = await Product.findById(product1Id);
    expect(product.stock).toBe(20);
  });

  test("order acceptance fails if stock is insufficient", async () => {
    // Reduce product stock to 5kg
    await Product.findByIdAndUpdate(product1Id, { stock: 5 });

    // Create RFQ for 15kg
    await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        productListings: [product1Id],
        quantity: 15,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });

    const suppQuotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier1Token}`);
    const quoteId = suppQuotes.body.quotations[0]._id;

    await request(app)
      .put(`/api/quotations/${quoteId}/respond`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        quotedPrice: 180,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      });

    const awardRes = await request(app)
      .put(`/api/quotations/${quoteId}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const orderId = awardRes.body.order._id;

    // Supplier tries to accept order with only 5 in stock
    const acceptRes = await request(app)
      .patch(`/api/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${supplier1Token}`);

    expect(acceptRes.status).toBe(400);
    expect(acceptRes.body.message).toMatch(/insufficient stock/i);

    // Stock remains unchanged at 5
    const product = await Product.findById(product1Id);
    expect(product.stock).toBe(5);
  });

  test("delivery status transitions enforced sequentially", async () => {
    // Create & award order
    await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        productListings: [product1Id],
        quantity: 10,
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      });

    const suppQuotes = await request(app)
      .get("/api/quotations/supplier")
      .set("Authorization", `Bearer ${supplier1Token}`);
    const quoteId = suppQuotes.body.quotations[0]._id;

    await request(app)
      .put(`/api/quotations/${quoteId}/respond`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({
        quotedPrice: 180,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      });

    const awardRes = await request(app)
      .put(`/api/quotations/${quoteId}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const orderId = awardRes.body.order._id;
    await request(app)
      .patch(`/api/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${supplier1Token}`);

    // Try skipping to "delivered" directly from "confirmed" -> should be rejected (400)
    const invalidJump = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({ orderStatus: "delivered" });
    expect(invalidJump.status).toBe(400);

    // Proper step 1: confirmed -> preparing
    const step1 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({ orderStatus: "preparing" });
    expect(step1.status).toBe(200);
    expect(step1.body.order.orderStatus).toBe("preparing");

    // Proper step 2: preparing -> out_for_delivery
    const step2 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({ orderStatus: "out_for_delivery" });
    expect(step2.status).toBe(200);
    expect(step2.body.order.orderStatus).toBe("out_for_delivery");

    // Proper step 3: out_for_delivery -> delivered
    const step3 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({ orderStatus: "delivered" });
    expect(step3.status).toBe(200);
    expect(step3.body.order.orderStatus).toBe("delivered");

    // Transitioning after "delivered" is prohibited
    const step4 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${supplier1Token}`)
      .send({ orderStatus: "preparing" });
    expect(step4.status).toBe(400);
  });
});
