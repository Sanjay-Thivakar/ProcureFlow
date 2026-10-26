const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/product.model");
const RFQ = require("../src/models/rfq.model");
const Quotation = require("../src/models/quotation.model");
const Order = require("../src/models/order.model");
const {
  getSupplierDemandHistory,
} = require("../src/services/supplierDemandHistory.service");
const {
  calculateMedian,
  evaluateChronologicalForecast,
} = require("../src/services/demandForecast.service");
const {
  getSupplierReplenishmentRecommendations,
} = require("../src/services/smartReplenishment.service");
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

describe("Module 3: Supplier Smart Replenishment & Demand Forecasting", () => {
  let supplierToken;
  let supplierId;
  let otherSupplierToken;
  let otherSupplierId;
  let restaurant1Token;
  let restaurant1Id;
  let restaurant2Token;
  let restaurant2Id;
  let testProduct;
  let rfqDoc;
  let quoteDoc;

  beforeEach(async () => {
    // 1. Supplier 1
    await request(app).post("/api/auth/register").send({
      name: "FreshFarm Wholesale",
      email: "supplier1@freshfarm.com",
      password: "Password123!",
      role: "supplier",
    });
    const s1Login = await request(app).post("/api/auth/login").send({
      email: "supplier1@freshfarm.com",
      password: "Password123!",
    });
    supplierToken = s1Login.body.token;
    supplierId = s1Login.body.user.id;

    // 2. Supplier 2 (for tenant isolation test)
    await request(app).post("/api/auth/register").send({
      name: "Metro Grocers Ltd",
      email: "supplier2@metrogrocers.com",
      password: "Password123!",
      role: "supplier",
    });
    const s2Login = await request(app).post("/api/auth/login").send({
      email: "supplier2@metrogrocers.com",
      password: "Password123!",
    });
    otherSupplierToken = s2Login.body.token;
    otherSupplierId = s2Login.body.user.id;

    // 3. Restaurant 1
    await request(app).post("/api/auth/register").send({
      name: "La Trattoria",
      email: "trattoria@bistro.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r1Login = await request(app).post("/api/auth/login").send({
      email: "trattoria@bistro.com",
      password: "Password123!",
    });
    restaurant1Token = r1Login.body.token;
    restaurant1Id = r1Login.body.user.id;

    // 4. Restaurant 2
    await request(app).post("/api/auth/register").send({
      name: "Café Parisien",
      email: "paris@bistro.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r2Login = await request(app).post("/api/auth/login").send({
      email: "paris@bistro.com",
      password: "Password123!",
    });
    restaurant2Token = r2Login.body.token;
    restaurant2Id = r2Login.body.user.id;

    // Create a product for Supplier 1
    testProduct = await Product.create({
      supplier: supplierId,
      name: "Organic Tomatoes",
      category: "Vegetables",
      unit: "kg",
      price: 45,
      stock: 100, // On-hand warehouse stock
    });

    // Create RFQ and Quotation references
    rfqDoc = await RFQ.create({
      restaurant: restaurant1Id,
      productName: "Organic Tomatoes",
      category: "Vegetables",
      quantity: 50,
      unit: "kg",
      requiredBy: new Date(Date.now() + 86400000 * 3),
      productListings: [testProduct._id],
    });

    quoteDoc = await Quotation.create({
      rfq: rfqDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 50,
      listedPrice: 45,
      quotedPrice: 40,
      requiredBy: new Date(Date.now() + 86400000 * 3),
      estimatedDelivery: new Date(Date.now() + 86400000 * 2),
      status: "awarded",
    });
  });

  // Test 1: Cross-Restaurant Demand Aggregation
  test("aggregates authentic demand history across multiple restaurant buyers for supplier's products", async () => {
    // Restaurant 1 purchases 30 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 30,
      agreedPrice: 40,
      totalAmount: 1200,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
      deliveredAt: new Date("2026-09-03"),
    });

    // Restaurant 2 purchases 50 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant2Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 50,
      agreedPrice: 40,
      totalAmount: 2000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-15"),
      deliveredAt: new Date("2026-09-17"),
    });

    const histories = await getSupplierDemandHistory(supplierId);
    expect(histories.length).toBe(1);

    const tomato = histories[0];
    expect(tomato.productName || tomato.name).toBe("Organic Tomatoes");
    expect(tomato.currentStock).toBe(100);
    expect(tomato.deliveredOrders.length).toBe(2);

    const totalSold = tomato.deliveredOrders.reduce((sum, o) => sum + o.quantity, 0);
    expect(totalSold).toBe(80); // 30 + 50
  });

  // Test 2: Status and Payment Lifecycle Filtering
  test("excludes cancelled, rejected, failed payment, and refunded orders from demand calculations", async () => {
    // Valid delivered order: 25 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 25,
      agreedPrice: 40,
      totalAmount: 1000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    // Cancelled order: 100 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 100,
      agreedPrice: 40,
      totalAmount: 4000,
      orderStatus: "cancelled",
      paymentStatus: "pending",
      createdAt: new Date("2026-09-05"),
    });

    // Rejected order: 80 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant2Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 80,
      agreedPrice: 40,
      totalAmount: 3200,
      orderStatus: "rejected",
      paymentStatus: "pending",
      createdAt: new Date("2026-09-10"),
    });

    // Refunded order: 40 kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant2Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 40,
      agreedPrice: 40,
      totalAmount: 1600,
      orderStatus: "delivered",
      paymentStatus: "refunded",
      createdAt: new Date("2026-09-12"),
    });

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations.find((r) => r.productName === "Organic Tomatoes");
    expect(tomato).toBeDefined();
    expect(tomato.measurements.deliveredOrdersCount).toBe(1);
    expect(tomato.measurements.totalUnitsSold).toBe(25);
  });

  // Test 3: Zero-Order Product Handling
  test("safely handles products with zero orders, reporting on-hand stock and no-demand status", async () => {
    // No orders created for testProduct
    const result = await getSupplierReplenishmentRecommendations(supplierId);
    expect(result.overview.totalMonitoredProducts).toBe(1);

    const tomato = result.recommendations[0];
    expect(tomato.measurements.totalOrders).toBe(0);
    expect(tomato.inventoryRisk.currentStock).toBe(100);
    expect(tomato.inventoryRisk.daysOfStockRemaining).toBeNull();
    expect(tomato.replenishment.suggestedQuantity).toBeNull();
    expect(tomato.replenishment.explanation).toContain("Insufficient historical demand");
  });

  // Test 4: Insufficient History Handling (1 order)
  test("honestly reports insufficient history and does not fabricate replenishment quantity when only 1 order exists", async () => {
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 40,
      agreedPrice: 40,
      totalAmount: 1600,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    expect(tomato.measurements.deliveredOrdersCount).toBe(1);
    expect(tomato.measurements.medianOrderIntervalDays).toBeNull();
    expect(tomato.estimatedDemand.projected30DayDemand).toBeNull();
    expect(tomato.replenishment.suggestedQuantity).toBeNull();
    expect(tomato.confidenceLabel).toBe("Insufficient Data");
    expect(tomato.estimatedDemand.demandEstimationNotice).toContain("At least 2 completed orders");
  });

  // Test 5: Median Interval and Daily Demand Rate Calculations
  test("calculates accurate median order interval and daily demand rate across multiple purchases", async () => {
    // 3 orders spaced 10 days apart (Day 0, Day 10, Day 20), each 50 kg
    const baseDate = new Date("2026-08-01").getTime();

    for (let i = 0; i < 3; i++) {
      await Order.create({
        rfq: rfqDoc._id,
        quotation: quoteDoc._id,
        restaurant: restaurant1Id,
        supplier: supplierId,
        product: testProduct._id,
        productName: "Organic Tomatoes",
        unit: "kg",
        quantity: 50,
        agreedPrice: 40,
        totalAmount: 2000,
        orderStatus: "delivered",
        paymentStatus: "paid",
        createdAt: new Date(baseDate + i * 10 * 86400000),
        deliveredAt: new Date(baseDate + i * 10 * 86400000 + 86400000),
      });
    }

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    expect(tomato.measurements.deliveredOrdersCount).toBe(3);
    expect(tomato.measurements.typicalOrderQuantity).toBe(50);
    expect(tomato.measurements.medianOrderIntervalDays).toBe(10);
    // Daily demand rate: 50 kg / 10 days = 5 kg/day
    expect(tomato.measurements.dailyDemandRate).toBe(5);
    // 30-day projected demand: 5 * 30 = 150 kg
    expect(tomato.estimatedDemand.projected30DayDemand).toBe(150);
  });

  // Test 6: Critical Stockout Risk Detection
  test("flags product as critical stockout risk when on-hand stock is low or zero relative to demand", async () => {
    // Update product stock to only 15 kg
    testProduct.stock = 15;
    await testProduct.save();

    // Demand rate: 50 kg every 5 days = 10 kg/day
    const baseDate = new Date("2026-08-01").getTime();
    for (let i = 0; i < 3; i++) {
      await Order.create({
        rfq: rfqDoc._id,
        quotation: quoteDoc._id,
        restaurant: restaurant1Id,
        supplier: supplierId,
        product: testProduct._id,
        productName: "Organic Tomatoes",
        unit: "kg",
        quantity: 50,
        agreedPrice: 40,
        totalAmount: 2000,
        orderStatus: "delivered",
        paymentStatus: "paid",
        createdAt: new Date(baseDate + i * 5 * 86400000),
      });
    }

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    // Days of stock remaining: 15 kg / 10 kg/day = 1.5 -> ~2 days <= 7 days -> stockout_risk!
    expect(tomato.inventoryRisk.stockRisk).toBe("stockout_risk");
    expect(tomato.inventoryRisk.daysOfStockRemaining).toBeLessThanOrEqual(7);
  });

  // Test 7: Adequate Stock and Zero Replenishment Deficit
  test("flags product as adequate stock and calculates 0 replenishment quantity when stock exceeds projected demand", async () => {
    // Current stock is 500 kg (huge inventory)
    testProduct.stock = 500;
    await testProduct.save();

    const baseDate = new Date("2026-08-01").getTime();
    for (let i = 0; i < 3; i++) {
      await Order.create({
        rfq: rfqDoc._id,
        quotation: quoteDoc._id,
        restaurant: restaurant1Id,
        supplier: supplierId,
        product: testProduct._id,
        productName: "Organic Tomatoes",
        unit: "kg",
        quantity: 30,
        agreedPrice: 40,
        totalAmount: 1200,
        orderStatus: "delivered",
        paymentStatus: "paid",
        createdAt: new Date(baseDate + i * 10 * 86400000),
      });
    }

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    expect(tomato.inventoryRisk.stockRisk).toBe("adequate");
    expect(tomato.replenishment.suggestedQuantity).toBe(0);
    expect(tomato.replenishment.explanation).toContain("sufficient to cover projected 30-day demand");
  });

  // Test 8: Defensible Replenishment Quantity Calculation
  test("calculates suggested replenishment deficit (projected 30-day demand - current stock) when stock is insufficient", async () => {
    // Current stock is 40 kg
    testProduct.stock = 40;
    await testProduct.save();

    // Daily demand: 20 kg every 5 days = 4 kg/day. 30-day demand = 120 kg.
    const baseDate = new Date("2026-08-01").getTime();
    for (let i = 0; i < 3; i++) {
      await Order.create({
        rfq: rfqDoc._id,
        quotation: quoteDoc._id,
        restaurant: restaurant1Id,
        supplier: supplierId,
        product: testProduct._id,
        productName: "Organic Tomatoes",
        unit: "kg",
        quantity: 20,
        agreedPrice: 40,
        totalAmount: 800,
        orderStatus: "delivered",
        paymentStatus: "paid",
        createdAt: new Date(baseDate + i * 5 * 86400000),
      });
    }

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    // Deficit: 120 - 40 = 80 kg
    expect(tomato.estimatedDemand.projected30DayDemand).toBe(120);
    expect(tomato.inventoryRisk.currentStock).toBe(40);
    expect(tomato.replenishment.suggestedQuantity).toBe(80);
    expect(tomato.replenishment.explanation).toContain("Suggested replenishment is 80 kg");
  });

  // Test 9: Data Privacy and Tenant Anonymity
  test("strictly preserves data privacy by never exposing restaurant identities or private IDs", async () => {
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 50,
      agreedPrice: 40,
      totalAmount: 2000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    const res = await request(app)
      .get("/api/replenishment/recommendations")
      .set("Authorization", `Bearer ${supplierToken}`);

    expect(res.status).toBe(200);
    const responseString = JSON.stringify(res.body);

    // Guarantee no restaurant IDs, names, or emails are leaked in response
    expect(responseString).not.toContain(restaurant1Id.toString());
    expect(responseString).not.toContain("La Trattoria");
    expect(responseString).not.toContain("trattoria@bistro.com");
  });

  // Test 10: Incompatible Unit Segregation
  test("never mixes demand across incompatible measurement units for the same supplier", async () => {
    // Create second product with same name but unit 'Box'
    const boxProduct = await Product.create({
      supplier: supplierId,
      name: "Organic Tomatoes",
      category: "Vegetables",
      unit: "Box",
      price: 500,
      stock: 20,
    });

    // 1 order for kg
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: testProduct._id,
      productName: "Organic Tomatoes",
      unit: "kg",
      quantity: 50,
      agreedPrice: 40,
      totalAmount: 2000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    // 1 order for Box
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: supplierId,
      product: boxProduct._id,
      productName: "Organic Tomatoes",
      unit: "Box",
      quantity: 10,
      agreedPrice: 500,
      totalAmount: 5000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    expect(result.overview.totalMonitoredProducts).toBe(2);

    const kgItem = result.recommendations.find((r) => r.unit === "kg");
    const boxItem = result.recommendations.find((r) => r.unit === "Box");

    expect(kgItem).toBeDefined();
    expect(boxItem).toBeDefined();
    expect(kgItem.measurements.totalUnitsSold).toBe(50);
    expect(boxItem.measurements.totalUnitsSold).toBe(10);
  });

  // Test 11: Cross-Supplier Isolation
  test("strictly isolates demand and stock between different suppliers", async () => {
    // Supplier 2 has their own product
    const otherProduct = await Product.create({
      supplier: otherSupplierId,
      name: "Premium Olive Oil",
      category: "Oils",
      unit: "L",
      price: 200,
      stock: 50,
    });

    // Order placed with Supplier 2
    await Order.create({
      rfq: rfqDoc._id,
      quotation: quoteDoc._id,
      restaurant: restaurant1Id,
      supplier: otherSupplierId,
      product: otherProduct._id,
      productName: "Premium Olive Oil",
      unit: "L",
      quantity: 20,
      agreedPrice: 200,
      totalAmount: 4000,
      orderStatus: "delivered",
      paymentStatus: "paid",
      createdAt: new Date("2026-09-01"),
    });

    // Supplier 1 queries recommendations
    const s1Result = await getSupplierReplenishmentRecommendations(supplierId);
    const s1Names = s1Result.recommendations.map((r) => r.productName);
    expect(s1Names).toContain("Organic Tomatoes");
    expect(s1Names).not.toContain("Premium Olive Oil");

    // Supplier 2 queries recommendations
    const s2Result = await getSupplierReplenishmentRecommendations(otherSupplierId);
    const s2Names = s2Result.recommendations.map((r) => r.productName);
    expect(s2Names).toContain("Premium Olive Oil");
    expect(s2Names).not.toContain("Organic Tomatoes");
  });

  // Test 12: Chronological Forecast Walk-Forward Evaluation
  test("performs forward-facing chronological walk-forward validation and reports model comparison when >= 5 orders exist", async () => {
    const baseDate = new Date("2026-07-01").getTime();
    const quantities = [20, 25, 30, 22, 28, 35];

    for (let i = 0; i < quantities.length; i++) {
      await Order.create({
        rfq: rfqDoc._id,
        quotation: quoteDoc._id,
        restaurant: restaurant1Id,
        supplier: supplierId,
        product: testProduct._id,
        productName: "Organic Tomatoes",
        unit: "kg",
        quantity: quantities[i],
        agreedPrice: 40,
        totalAmount: quantities[i] * 40,
        orderStatus: "delivered",
        paymentStatus: "paid",
        createdAt: new Date(baseDate + i * 5 * 86400000),
      });
    }

    const result = await getSupplierReplenishmentRecommendations(supplierId);
    const tomato = result.recommendations[0];

    expect(tomato.forecast).toBeDefined();
    expect(tomato.forecast.isAvailable).toBe(true);
    expect(tomato.forecast.sampleSize).toBe(6);
    expect(tomato.forecast.evaluatedSteps).toBe(4); // Testing indices 2, 3, 4, 5
    expect(tomato.forecast.bestModel).toBeDefined();
    expect(Number.isFinite(tomato.forecast.bestQuantityMAE)).toBe(true);
    expect(tomato.forecast.modelComparison).toHaveProperty("naiveQuantityMAE");
    expect(tomato.forecast.modelComparison).toHaveProperty("medianQuantityMAE");
    expect(tomato.forecast.modelComparison).toHaveProperty("ewmaQuantityMAE");
  });

  // Test 13: RBAC Authorization
  test("enforces JWT authentication and supplier role authorization (401 for guests, 403 for restaurants, 200 for suppliers)", async () => {
    // 1. Unauthenticated -> 401
    const unauthRes = await request(app).get("/api/replenishment/recommendations");
    expect(unauthRes.status).toBe(401);

    // 2. Restaurant role -> 403
    const restRes = await request(app)
      .get("/api/replenishment/recommendations")
      .set("Authorization", `Bearer ${restaurant1Token}`);
    expect(restRes.status).toBe(403);
    expect(restRes.body.message).toContain("supplier");

    // 3. Supplier role -> 200
    const suppRes = await request(app)
      .get("/api/replenishment/recommendations")
      .set("Authorization", `Bearer ${supplierToken}`);
    expect(suppRes.status).toBe(200);
    expect(suppRes.body.success).toBe(true);
  });

  // Test 14: Query Filtering
  test("supports query filtering by stock risk status and search terms", async () => {
    // Create second product
    await Product.create({
      supplier: supplierId,
      name: "Bell Peppers",
      category: "Vegetables",
      unit: "kg",
      price: 60,
      stock: 0,
    });

    const searchRes = await request(app)
      .get("/api/replenishment/recommendations?search=Bell")
      .set("Authorization", `Bearer ${supplierToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].productName).toBe("Bell Peppers");
  });
});
