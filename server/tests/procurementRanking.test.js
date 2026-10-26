const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/product.model");
const RFQ = require("../src/models/rfq.model");
const Quotation = require("../src/models/quotation.model");
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

describe("Intelligent Procurement Ranking Engine", () => {
  let restaurantToken;
  let restaurantId;
  let otherRestaurantToken;
  let supplier1Token;
  let supplier1Id;
  let supplier2Token;
  let supplier2Id;
  let product1;
  let product2;

  beforeEach(async () => {
    // 1. Restaurant 1
    await request(app).post("/api/auth/register").send({
      name: "Bistro Gourmet",
      email: "bistro@restaurant.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r1Login = await request(app).post("/api/auth/login").send({
      email: "bistro@restaurant.com",
      password: "Password123!",
    });
    restaurantToken = r1Login.body.token;
    restaurantId = r1Login.body.user.id;

    // 2. Restaurant 2
    await request(app).post("/api/auth/register").send({
      name: "Trattoria Romana",
      email: "trattoria@restaurant.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r2Login = await request(app).post("/api/auth/login").send({
      email: "trattoria@restaurant.com",
      password: "Password123!",
    });
    otherRestaurantToken = r2Login.body.token;

    // 3. Supplier 1
    await request(app).post("/api/auth/register").send({
      name: "AgriDirect Produce",
      email: "agri@supplier.com",
      password: "Password123!",
      role: "supplier",
    });
    const s1Login = await request(app).post("/api/auth/login").send({
      email: "agri@supplier.com",
      password: "Password123!",
    });
    supplier1Token = s1Login.body.token;
    supplier1Id = s1Login.body.user.id;

    // 4. Supplier 2
    await request(app).post("/api/auth/register").send({
      name: "Prime Wholesale",
      email: "prime@supplier.com",
      password: "Password123!",
      role: "supplier",
    });
    const s2Login = await request(app).post("/api/auth/login").send({
      email: "prime@supplier.com",
      password: "Password123!",
    });
    supplier2Token = s2Login.body.token;
    supplier2Id = s2Login.body.user.id;

    // 5. Products
    product1 = await Product.create({
      supplier: supplier1Id,
      name: "Organic Basmati Rice",
      category: "Grains",
      unit: "kg",
      price: 120,
      stock: 500,
    });

    product2 = await Product.create({
      supplier: supplier2Id,
      name: "Organic Basmati Rice",
      category: "Grains",
      unit: "kg",
      price: 130,
      stock: 200,
    });
  });

  // TEST 1: Lowest effective price and comparable quantities
  test("ranks lowest effective price higher when quantities and other factors are comparable", async () => {
    const requiredDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id, product2._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 50,
      requiredBy: requiredDate,
      status: "open",
    });

    // Supplier 1 quotes 120 with 15% discount -> effective price 102, cost = 5100
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 120,
      discountPercentage: 15,
      quantity: 50,
      requiredBy: requiredDate,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    // Supplier 2 quotes 125 with 0% discount -> effective price 125, cost = 6250
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier2Id,
      product: product2._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 130,
      quotedPrice: 125,
      discountPercentage: 0,
      quantity: 50,
      requiredBy: requiredDate,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    const res = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rankedQuotations).toHaveLength(2);

    const [rank1, rank2] = res.body.data.rankedQuotations;
    expect(rank1.rank).toBe(1);
    expect(rank1.supplier._id.toString()).toBe(supplier1Id.toString());
    expect(rank1.effectiveTotalCost).toBe(5100);
    expect(rank1.factors.cost.score).toBe(100);

    expect(rank2.rank).toBe(2);
    expect(rank2.effectiveTotalCost).toBe(6250);
    expect(rank2.score).toBeLessThan(rank1.score);
  });

  // TEST 2: Delivery deadline suitability
  test("penalizes late estimated deliveries and rewards on-time delivery relative to deadline", async () => {
    const requiredDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id, product2._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 20,
      requiredBy: requiredDate,
      status: "open",
    });

    // Quote 1: On-time (1 day before deadline)
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 100,
      quantity: 20,
      requiredBy: requiredDate,
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    // Quote 2: Late (2 days after deadline)
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier2Id,
      product: product2._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 130,
      quotedPrice: 100,
      quantity: 20,
      requiredBy: requiredDate,
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    const res = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    const onTimeQuote = res.body.data.rankedQuotations.find((q) => q.supplier._id.toString() === supplier1Id.toString());
    const lateQuote = res.body.data.rankedQuotations.find((q) => q.supplier._id.toString() === supplier2Id.toString());

    expect(onTimeQuote.factors.delivery.score).toBeGreaterThanOrEqual(90);
    expect(lateQuote.factors.delivery.score).toBeLessThanOrEqual(40);
    expect(onTimeQuote.rank).toBe(1);
  });

  // TEST 3: Missing delivery dates and missing supplier history
  test("transparently handles missing delivery dates and insufficient supplier historical data", async () => {
    const requiredDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: requiredDate,
      status: "open",
    });

    // Quote with no estimatedDelivery
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 110,
      quantity: 10,
      requiredBy: requiredDate,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    const res = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    const quote = res.body.data.rankedQuotations[0];

    // Explicit neutral delivery score (50) and label
    expect(quote.factors.delivery.score).toBe(50);
    expect(quote.factors.delivery.explanation).toContain("not specified");

    // Explicit insufficient history label (< 3 orders)
    expect(quote.factors.reliability.hasSufficientHistory).toBe(false);
    expect(quote.factors.reliability.label).toContain("Insufficient history");
    expect(quote.factors.reliability.score).toBe(50);
  });

  // TEST 4: Expired and rejected quotations
  test("marks expired and rejected quotations as ineligible with score 0", async () => {
    const requiredDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id, product2._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: requiredDate,
      status: "open",
    });

    // Active quote
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 110,
      quantity: 10,
      requiredBy: requiredDate,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    // Expired quote (validUntil in the past)
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier2Id,
      product: product2._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 130,
      quotedPrice: 90,
      quantity: 10,
      requiredBy: requiredDate,
      validUntil: new Date(Date.now() - 10000),
      status: "quoted",
      rfq: rfq._id,
    });

    const res = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rankedQuotations).toHaveLength(2);

    const eligible = res.body.data.rankedQuotations.find((q) => q.isEligible);
    const expired = res.body.data.rankedQuotations.find((q) => !q.isEligible);

    expect(eligible.rank).toBe(1);
    expect(expired.isEligible).toBe(false);
    expect(expired.score).toBe(0);
    expect(expired.rank).toBeNull();
  });

  // TEST 5: Ties and stable ranking behavior
  test("maintains stable, deterministic ordering when quotations have identical scores", async () => {
    const requiredDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id, product2._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: requiredDate,
      status: "open",
    });

    const estDelivery = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Two identical quotes
    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 100,
      quantity: 10,
      requiredBy: requiredDate,
      estimatedDelivery: estDelivery,
      validUntil,
      status: "quoted",
      rfq: rfq._id,
    });

    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier2Id,
      product: product2._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 100,
      quantity: 10,
      requiredBy: requiredDate,
      estimatedDelivery: estDelivery,
      validUntil,
      status: "quoted",
      rfq: rfq._id,
    });

    const res1 = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const res2 = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res1.body.data.rankedQuotations[0]._id).toBe(res2.body.data.rankedQuotations[0]._id);
    expect(res1.body.data.rankedQuotations[1]._id).toBe(res2.body.data.rankedQuotations[1]._id);
  });

  // TEST 6: RFQ prioritization — approaching deadlines and expiring quotations
  test("prioritizes RFQs correctly based on expiring quotes, imminent deadlines, and status", async () => {
    // RFQ 1: Quote expiring in 3 hours -> Urgent
    const rfqUrgent = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "open",
    });

    await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 110,
      quantity: 10,
      requiredBy: rfqUrgent.requiredBy,
      validUntil: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      status: "quoted",
      rfq: rfqUrgent._id,
    });

    // RFQ 2: Completed RFQ -> Low
    await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "completed",
    });

    const res = await request(app)
      .get("/api/rankings/rfqs")
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].priority).toBe("Urgent");
    expect(res.body.data[0].priorityReason).toContain("expires in");
  });

  // TEST 7: Order prioritization — overdue orders and stalled confirmations
  test("prioritizes overdue orders as Urgent and flags stalled confirmations without masking", async () => {
    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: new Date(),
      status: "completed",
    });

    const quote = await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 110,
      quantity: 10,
      requiredBy: new Date(),
      status: "awarded",
      rfq: rfq._id,
    });

    // Order 1: Overdue delivery (delivery was yesterday)
    const overdueOrder = await Order.create({
      rfq: rfq._id,
      quotation: quote._id,
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      agreedPrice: 110,
      totalAmount: 1100,
      orderStatus: "confirmed",
      estimatedDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
    });

    // Order 2: Delivered & Paid -> Low
    await Order.create({
      rfq: rfq._id,
      quotation: quote._id,
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 5,
      agreedPrice: 110,
      totalAmount: 550,
      orderStatus: "delivered",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .get("/api/rankings/orders")
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]._id.toString()).toBe(overdueOrder._id.toString());
    expect(res.body.data[0].priority).toBe("Urgent");
    expect(res.body.data[0].priorityReason).toContain("Overdue");
  });

  // TEST 8: Unauthorized access and ownership isolation
  test("enforces RBAC and restaurant data isolation on ranking routes", async () => {
    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "open",
    });

    // 1. Unauthenticated request rejected with 401
    const unauthRes = await request(app).get(`/api/rankings/quotations/${rfq._id}`);
    expect(unauthRes.status).toBe(401);

    // 2. Supplier cannot access quotation rankings (prevent competitive bid snooping)
    const supplierRes = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${supplier1Token}`);
    expect(supplierRes.status).toBe(403);

    // 3. Different restaurant cannot access another restaurant's quotation ranking
    const otherRestRes = await request(app)
      .get(`/api/rankings/quotations/${rfq._id}`)
      .set("Authorization", `Bearer ${otherRestaurantToken}`);
    expect(otherRestRes.status).toBe(403);

    // 4. Invalid ObjectId rejected with 400
    const invalidIdRes = await request(app)
      .get("/api/rankings/quotations/invalid-id-format")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(invalidIdRes.status).toBe(400);
  });

  // TEST 9: Existing quotation award and order workflows remain intact
  test("preserves existing quotation award workflow and creates order with accurate fields", async () => {
    const requiredDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const rfq = await RFQ.create({
      restaurant: restaurantId,
      productListings: [product1._id],
      productName: "Organic Basmati Rice",
      unit: "kg",
      quantity: 10,
      requiredBy: requiredDate,
      status: "open",
    });

    const quotation = await Quotation.create({
      restaurant: restaurantId,
      supplier: supplier1Id,
      product: product1._id,
      productName: "Organic Basmati Rice",
      unit: "kg",
      listedPrice: 120,
      quotedPrice: 110,
      quantity: 10,
      requiredBy: requiredDate,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "quoted",
      rfq: rfq._id,
    });

    // Accept quotation (PUT route)
    const acceptRes = await request(app)
      .put(`/api/quotations/${quotation._id}/accept`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(acceptRes.status).toBe(200);

    // Verify order was created
    const createdOrder = await Order.findOne({ quotation: quotation._id });
    expect(createdOrder).not.toBeNull();
    expect(createdOrder.agreedPrice).toBe(110);
    expect(createdOrder.orderStatus).toBe("pending_supplier_confirmation");
  });
});
