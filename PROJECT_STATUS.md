# ProcureFlow - Stabilization & Engineering Status Report

## 1. System Architecture Map

ProcureFlow is a B2B restaurant-to-restaurant procurement platform connecting Restaurants with Suppliers for bulk inventory purchasing, competitive RFQ bidding, and fulfillment.

### Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, React Router DOM 7, React Hook Form, Lucide React, Axios.
- **Backend**: Node.js 22, Express 5, MongoDB, Mongoose 9, JWT, BcryptJS, Razorpay SDK.
- **Testing**: Jest 30, Supertest 7, MongoMemoryServer 11.

### Component & Data Flow Mapping
| Layer | Components / Files | Role & Responsibilities |
|---|---|---|
| **Auth** | [auth.middleware.js](file:///server/src/middleware/auth.middleware.js), [auth.controller.js](file:///server/src/controllers/auth.controller.js), [user.model.js](file:///server/src/models/user.model.js) | JWT extraction, role verification (`authorize('restaurant', 'supplier')`), credential validation. |
| **Products** | [product.model.js](file:///server/src/models/product.model.js), [product.controller.js](file:///server/src/controllers/product.controller.js), [product.routes.js](file:///server/src/routes/product.routes.js) | Supplier catalog management, stock tracking, unit enum enforcement, field whitelisting. |
| **RFQs** | [rfq.model.js](file:///server/src/models/rfq.model.js), [rfq.controller.js](file:///server/src/controllers/rfq.controller.js), [rfq.routes.js](file:///server/src/routes/rfq.routes.js) | Multi-supplier comparison, same-item integrity validation, ownership-controlled access. |
| **Quotations** | [quotation.model.js](file:///server/src/models/quotation.model.js), [quotation.controller.js](file:///server/src/controllers/quotation.controller.js), [quotation.routes.js](file:///server/src/routes/quotation.routes.js) | Supplier bids, auto-expiration, atomic quotation awarding, auto-rejection of competing bids. |
| **Orders** | [order.model.js](file:///server/src/models/order.model.js), [order.controller.js](file:///server/src/controllers/order.controller.js), [order.routes.js](file:///server/src/routes/order.routes.js) | Atomic order acceptance, conditional stock deduction, sequential state transition validation. |
| **Payments** | [payment.model.js](file:///server/src/models/payment.model.js), [payment.controller.js](file:///server/src/controllers/payment.controller.js), [payment.routes.js](file:///server/src/routes/payment.routes.js) | Post-delivery Razorpay order creation, timing-safe HMAC SHA-256 verification, duplicate payment prevention. |
| **Recommendations** | [productRecommendation.service.js](file:///server/src/services/productRecommendation.service.js), [productRecommendation.controller.js](file:///server/src/controllers/productRecommendation.controller.js), [productRecommendation.routes.js](file:///server/src/routes/productRecommendation.routes.js) | 3-tier smart companion recommendation engine (Complementary Rules -> Historical Co-Purchases -> Category Proximity). |
| **Procurement Ranking** | [quotationRanking.service.js](file:///server/src/services/quotationRanking.service.js), [rfqPriority.service.js](file:///server/src/services/rfqPriority.service.js), [orderPriority.service.js](file:///server/src/services/orderPriority.service.js), [procurementRanking.controller.js](file:///server/src/controllers/procurementRanking.controller.js) | Explainable quotation ranking, RFQ urgency prioritization, and order deadline prioritization with restaurant/supplier RBAC. |
| **Replenishment & Forecasting** | [supplierDemandHistory.service.js](file:///server/src/services/supplierDemandHistory.service.js), [demandForecast.service.js](file:///server/src/services/demandForecast.service.js), [smartReplenishment.service.js](file:///server/src/services/smartReplenishment.service.js), [smartReplenishment.controller.js](file:///server/src/controllers/smartReplenishment.controller.js), [smartReplenishment.routes.js](file:///server/src/routes/smartReplenishment.routes.js) | Supplier replenishment engine, cross-restaurant order demand aggregation with privacy protection, live warehouse stock risk analysis, chronological baseline walk-forward forecast evaluation (Naive vs Median vs EWMA), and restock planning. |

---

## 2. Source of Truth Reference Table

| Entity | Primary Collection / Model | Key Source-of-Truth Fields | Access & Mutation Rules |
|---|---|---|---|
| **Products & Stock** | `Product` | `stock`, `price`, `unit`, `supplier` | Only owning supplier can update/delete; inventory deducted atomically upon order acceptance. |
| **RFQs** | `RFQ` | `status` (`open`, `completed`), `productListings`, `requiredBy` | Created by restaurants; completed automatically upon quotation award. |
| **Quotations & Pricing** | `Quotation` | `status` (`pending`, `quoted`, `awarded`, `rejected`, `expired`), `quotedPrice`, `discountPercentage`, `estimatedDelivery`, `validUntil` | Responded by supplier; awarded by restaurant; expires after 48h. |
| **Orders & Delivery** | `Order` | `orderStatus`, `estimatedDelivery`, `deliveredAt` | State moves strictly sequentially; stock deducted atomically on acceptance; delivery timestamp recorded. |
| **Payment Status** | `Payment` & `Order` | `paymentStatus` (`pending`, `paid`, `failed`) | Verified via Razorpay HMAC signature; triggers atomic status update across Payment and Order. |

---

## 3. Stabilization Fixes Implemented

1. **Secret & Credential Sanitization**:
   - Untracked `server/test.connection.js` from git and scrubbed hardcoded MongoDB Atlas credentials.
   - Removed `console.log(uri)` in `server/src/config/db.js` which dumped credentials.
   - Removed `console.log(user)` in `server/src/controllers/auth.controller.js` which dumped password hashes.
   - Created `server/.env.example` with standard environment configurations.
   - Added test connection scripts to `.gitignore`.

2. **Role-Based Authorization & Ownership Control**:
   - Implemented `authorize(...roles)` in `server/src/middleware/auth.middleware.js`.
   - Secured all routes in `product.routes.js`, `rfq.routes.js`, `quotation.routes.js`, `order.routes.js`, and `payment.routes.js`.
   - Fixed RFQ detail access in `getRFQDetails`: verified ownership for restaurants and filtered quotations so suppliers can only view their own bid, keeping competing bids confidential.

3. **Product Update Whitelisting (Mass Assignment Protection)**:
   - Restricted `updateProduct` to explicit allowed fields: `name`, `category`, `unit`, `price`, `stock`.
   - Prohibited mutation of immutable fields (`supplier`, `_id`, `timestamps`).
   - Added type and non-negative number validation.

4. **Multi-Document Atomicity & Concurrency Guards**:
   - Created `runInTransaction` in `server/src/utils/transaction.js` supporting replica set / Atlas deployments with automatic graceful fallback for standalone instances.
   - Quotation award: atomically sets quote to `awarded`, marks RFQ `completed`, creates `Order`, and rejects competing bids.
   - Order confirmation: uses atomic conditional decrement (`stock: { $gte: order.quantity }`, `$inc: { stock: -order.quantity }`) preventing overselling or race conditions.
   - Payment verification: utilizes timing-safe buffer comparison to prevent timing attacks and `RangeError` crashes; rejects duplicate verification attempts.

---

## 4. Test Suite

Automated backend test suite located in `server/tests/`:
- `tests/auth.test.js`: Registration, duplicate check, login, JWT validation, and RBAC enforcement.
- `tests/product.test.js`: Creation, negative price/stock rejection, field whitelisting, ownership controls.
- `tests/rfq.test.js`: Same-item validation, multi-supplier comparison, ownership and competitive quote privacy.
- `tests/quotation_and_order.test.js`: Quotation responses, expiration check, award flow, atomic stock deduction, sequential delivery status transitions.
- `tests/payment.test.js`: Delivery requirement check, Razorpay order creation, timing-safe HMAC verification, duplicate payment rejection, unauthorized verification prevention.
- `tests/productRecommendation.test.js`: Rule matching, stock filtering, category fallback, co-purchase analysis, isolation.
- `tests/procurementRanking.test.js`: Effective cost evaluation, deadline proximity, missing data handling, deterministic ties, RFQ/order prioritization, and award workflow integrity.
- `tests/smartReplenishment.test.js`: Supplier demand aggregation, cross-restaurant order eligibility and payment status filters, zero-order catalog products, on-hand stockout risk, 30-day deficit calculations, data privacy, unit segregation, cross-supplier isolation, walk-forward forecast evaluation with out-of-sample MAE, and supplier RBAC enforcement.

