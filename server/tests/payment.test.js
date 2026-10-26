const crypto = require("crypto");
const request = require("supertest");
const app = require("../src/app");
const razorpay = require("../src/config/razorpay");
const Order = require("../src/models/order.model");
const Product = require("../src/models/product.model");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./setup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Payment Integration & Verification", () => {
  let restaurantToken;
  let restaurant2Token;
  let supplierToken;
  let order;

  beforeEach(async () => {
    // Restaurant 1
    await request(app).post("/api/auth/register").send({
      name: "Pasta House",
      email: "pasta@test.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r1 = await request(app).post("/api/auth/login").send({
      email: "pasta@test.com",
      password: "Password123!",
    });
    restaurantToken = r1.body.token;
    const restaurantId = r1.body.user.id;

    // Restaurant 2 (for unauthorized payment verification tests)
    await request(app).post("/api/auth/register").send({
      name: "Pizza Palace",
      email: "pizza@test.com",
      password: "Password123!",
      role: "restaurant",
    });
    const r2 = await request(app).post("/api/auth/login").send({
      email: "pizza@test.com",
      password: "Password123!",
    });
    restaurant2Token = r2.body.token;

    // Supplier
    await request(app).post("/api/auth/register").send({
      name: "Dairy Best",
      email: "dairy@test.com",
      password: "Password123!",
      role: "supplier",
    });
    const s = await request(app).post("/api/auth/login").send({
      email: "dairy@test.com",
      password: "Password123!",
    });
    supplierToken = s.body.token;
    const supplierId = s.body.user.id;

    const product = await Product.create({
      supplier: supplierId,
      name: "Butter",
      category: "Dairy",
      unit: "kg",
      price: 150,
      stock: 100,
    });

    // Create a delivered order
    order = await Order.create({
      rfq: "650000000000000000000001",
      quotation: "650000000000000000000002",
      restaurant: restaurantId,
      supplier: supplierId,
      product: product._id,
      productName: "Butter",
      unit: "kg",
      quantity: 10,
      agreedPrice: 140,
      totalAmount: 1400,
      orderStatus: "delivered",
      paymentStatus: "pending",
    });
  });

  test("cannot initiate payment if order is not delivered", async () => {
    // Temporarily set orderStatus to confirmed
    await Order.findByIdAndUpdate(order._id, { orderStatus: "confirmed" });

    const res = await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only be made after delivery/i);
  });

  test("initiates Razorpay payment order for delivered order", async () => {
    jest.spyOn(razorpay.orders, "create").mockResolvedValue({
      id: "order_rzp_mock_123456",
      amount: 140000,
      currency: "INR",
      receipt: `order_${order._id}`,
    });

    const res = await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.razorpayOrder.id).toBe("order_rzp_mock_123456");
    expect(res.body.paymentId).toBeDefined();
  });

  test("successfully verifies payment with authentic HMAC signature and updates order status", async () => {
    const mockRzpOrderId = "order_rzp_valid_999";
    const mockPaymentId = "pay_rzp_valid_888";

    jest.spyOn(razorpay.orders, "create").mockResolvedValue({
      id: mockRzpOrderId,
      amount: 140000,
      currency: "INR",
    });

    await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    // Generate valid HMAC SHA256 signature
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${mockRzpOrderId}|${mockPaymentId}`)
      .digest("hex");

    const verifyRes = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        razorpay_order_id: mockRzpOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.payment.paymentStatus).toBe("paid");

    // Verify order paymentStatus updated to paid
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("paid");
  });

  test("rejects forged or invalid signature without crashing", async () => {
    const mockRzpOrderId = "order_rzp_invalid_111";

    jest.spyOn(razorpay.orders, "create").mockResolvedValue({
      id: mockRzpOrderId,
      amount: 140000,
      currency: "INR",
    });

    await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    // Send forged signature
    const verifyRes = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        razorpay_order_id: mockRzpOrderId,
        razorpay_payment_id: "pay_fake_123",
        razorpay_signature: "bad_signature_value_not_matching_hex_hmac",
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.message).toMatch(/verification failed/i);
  });

  test("rejects duplicate payment verification attempts", async () => {
    const mockRzpOrderId = "order_rzp_dup_222";
    const mockPaymentId = "pay_rzp_dup_333";

    jest.spyOn(razorpay.orders, "create").mockResolvedValue({
      id: mockRzpOrderId,
      amount: 140000,
      currency: "INR",
    });

    await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${mockRzpOrderId}|${mockPaymentId}`)
      .digest("hex");

    // First verification: success
    const firstVerify = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        razorpay_order_id: mockRzpOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
      });
    expect(firstVerify.status).toBe(200);

    // Second verification attempt: should be rejected
    const secondVerify = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        razorpay_order_id: mockRzpOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
      });

    expect(secondVerify.status).toBe(400);
    expect(secondVerify.body.message).toMatch(/already been verified/i);
  });

  test("unauthorized restaurant cannot verify another restaurant's payment", async () => {
    const mockRzpOrderId = "order_rzp_unauth_444";
    const mockPaymentId = "pay_rzp_unauth_555";

    jest.spyOn(razorpay.orders, "create").mockResolvedValue({
      id: mockRzpOrderId,
      amount: 140000,
      currency: "INR",
    });

    await request(app)
      .post(`/api/payments/${order._id}/create`)
      .set("Authorization", `Bearer ${restaurantToken}`);

    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${mockRzpOrderId}|${mockPaymentId}`)
      .digest("hex");

    // Restaurant 2 attempts to verify Restaurant 1's payment
    const res = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${restaurant2Token}`)
      .send({
        razorpay_order_id: mockRzpOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
      });

    expect(res.status).toBe(403);
  });
});
