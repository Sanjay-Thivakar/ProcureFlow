# ProcureFlow Feature File Registry

This registry documents all feature implementations across the ProcureFlow platform, tracking file paths, responsibilities, architectural connections, API endpoints, and associated automated test coverage.

---

## Module 1: Smart Product Recommendations

### 1. Backend Recommendation Service
- **Path**: `server/src/services/productRecommendation.service.js`
- **Status**: New
- **Responsibility**: Houses core recommendation business logic and scoring algorithms using a 3-tier fallback hierarchy (Complementary Rules -> Historical Co-Purchases -> Category Proximity). Excludes target product, enforces positive inventory (`stock > 0`), and deduplicates recommendations across multiple supplier listings by product name.
- **Key Functions / Exports**:
  - `getRecommendations({ productId, query, category, limit, restaurantId })`: Primary entry point for recommendation generation.
  - `getComplementaryProductRecommendations({ product, limit })`: Rule-based matching using `COMPLEMENTARY_RULES` mapping.
  - `getHistoricalCoPurchases({ product, limit, restaurantId })`: MongoDB aggregation over completed/in-flight `Order` records identifying co-purchased companion items while preserving restaurant isolation.
  - `getRelatedCategoryRecommendations({ product, category, limit, excludeNames })`: Category-level fallback with domain-specific category proximity weighting.
  - `deduplicateByProductName(products, limit)`: Deduplicates multiple supplier offerings for the same item name, picking the best-priced/highest-stock variant.
- **Connections**:
  - Consumes: `server/src/models/product.model.js`, `server/src/models/order.model.js`.
  - Invoked by: `server/src/controllers/productRecommendation.controller.js`.
- **API Endpoint**: N/A (Internal Service).
- **Test File**: `server/tests/productRecommendation.test.js` (`npm test tests/productRecommendation.test.js`).

---

### 2. Backend Recommendation Controller
- **Path**: `server/src/controllers/productRecommendation.controller.js`
- **Status**: New
- **Responsibility**: Validates request parameters (MongoDB ObjectIds, query strings, pagination limits), orchestrates service calls, formats consistent JSON responses, and returns HTTP status codes with informative error handling.
- **Key Functions / Exports**:
  - `getProductRecommendations(req, res)`: Handler for `GET /api/products/:id/recommendations` and `GET /api/recommendations/:id`.
  - `getContextRecommendations(req, res)`: Handler for contextual search/category recommendations `GET /api/products/recommendations?query=...&category=...`.
- **Connections**:
  - Consumes: `server/src/services/productRecommendation.service.js`.
  - Routes: `server/src/routes/productRecommendation.routes.js`, `server/src/routes/product.routes.js`.
- **API Endpoints**:
  - `GET /api/products/:id/recommendations`
  - `GET /api/products/recommendations`
  - `GET /api/recommendations/:id`
  - `GET /api/recommendations`
- **Test File**: `server/tests/productRecommendation.test.js`.

---

### 3. Backend Dedicated Recommendation Routes
- **Path**: `server/src/routes/productRecommendation.routes.js`
- **Status**: New
- **Responsibility**: Express router mounting dedicated recommendation routes under `/api/recommendations`, protected by JWT authentication and restaurant role authorization (`authorize("restaurant")`).
- **Key Functions / Exports**:
  - Express `Router()` instance configured with `protect` and `authorize("restaurant")`.
- **Connections**:
  - Consumes: `server/src/controllers/productRecommendation.controller.js`, `server/src/middleware/auth.middleware.js`.
  - Mounted by: `server/src/app.js`.
- **API Endpoints**:
  - `GET /api/recommendations`
  - `GET /api/recommendations/:id`
- **Test File**: `server/tests/productRecommendation.test.js`.

---

### 4. Backend Product Routes (Integration)
- **Path**: `server/src/routes/product.routes.js`
- **Status**: Modified
- **Responsibility**: Augmented existing product routing to expose nested recommendation sub-routes (`/recommendations` and `/:id/recommendations`) before the wildcard `/:id` route, ensuring zero routing ambiguity.
- **Key Functions / Exports**:
  - Mounted `getProductRecommendations` and `getContextRecommendations` with restaurant authorization middleware.
- **Connections**:
  - Consumes: `server/src/controllers/productRecommendation.controller.js`, `server/src/controllers/product.controller.js`.
  - Mounted by: `server/src/app.js`.
- **API Endpoints**:
  - `GET /api/products/recommendations`
  - `GET /api/products/:id/recommendations`
- **Test File**: `server/tests/productRecommendation.test.js`.

---

### 5. Backend Server Application Entry
- **Path**: `server/src/app.js`
- **Status**: Modified
- **Responsibility**: Main Express application initialization. Registers middleware, mounts `/api/recommendations` alongside existing `/api/products`, `/api/rfqs`, etc., and configures global error handlers.
- **Key Functions / Exports**:
  - Express app instance export.
- **Connections**:
  - Imports: `server/src/routes/productRecommendation.routes.js`.
- **Test File**: `server/tests/productRecommendation.test.js`.

---

### 6. Backend Automated Test Suite
- **Path**: `server/tests/productRecommendation.test.js`
- **Status**: New
- **Responsibility**: Comprehensive automated unit and integration tests verifying all required recommendation scenarios:
  1. Configured complementary products (e.g. Milk -> Cheese, Butter, Cream).
  2. Stock exclusion (`stock: 0` out-of-stock listings omitted).
  3. Related category fallbacks when direct pairings do not exist.
  4. Empty or insufficient purchase history fallback.
  5. Genuine co-purchase patterns from historical orders.
  6. Restaurant data isolation (verifies zero leakage of other restaurants' orders/identities).
  7. Invalid MongoDB ObjectId rejection (HTTP 400).
  8. Non-existent product ID handling (HTTP 404).
  9. Authentication & restaurant RBAC enforcement (unauthenticated 401, supplier role 403).
  10. Contextual search queries via query string (`?query=Bread`).
  11. Deduplication across multiple supplier listings of identical product items.
  12. Dedicated recommendation route operation.
- **How to Run**:
  ```bash
  cd server && npm test tests/productRecommendation.test.js
  ```

---

### 7. Frontend Recommendation Service Client
- **Path**: `client/src/services/productRecommendationService.js`
- **Status**: New
- **Responsibility**: API client functions communicating with backend recommendation endpoints via configured Axios instance (`client/src/services/api.js`). Handles token forwarding, error interception, and sanitization of returned recommendations.
- **Key Functions / Exports**:
  - `getProductRecommendations(productId, limit = 4)`: Calls `GET /api/products/:id/recommendations`.
  - `getContextRecommendations({ query, category, limit = 4 })`: Calls `GET /api/products/recommendations`.
- **Connections**:
  - Consumes: `client/src/services/api.js`.
  - Invoked by: `client/src/components/recommendations/ProductRecommendations.jsx`.
- **Test / Verification**: Tested via frontend integration and Vite production build.

---

### 8. Frontend Recommendation UI Component
- **Path**: `client/src/components/recommendations/ProductRecommendations.jsx`
- **Status**: New
- **Responsibility**: Polished, responsive React component presenting smart companion product recommendations to restaurant buyers. Features:
  - "You may also need" heading with contextual subtitle.
  - Recommendation reason badge ("Smart Complement", "Frequently Paired", "Related Category").
  - Real-time details: product name, supplier store name, unit price, stock availability, category.
  - Interactive actions: "Add to RFQ" / "Compare Suppliers" button, "Dismiss" option.
  - Loading skeleton state, graceful empty state, error state with retry button.
  - Responsive flex/grid design adapting seamlessly from mobile viewports to desktop layouts.
- **Key Functions / Exports**:
  - `ProductRecommendations`: Main exported React component.
- **Connections**:
  - Consumes: `client/src/services/productRecommendationService.js`.
  - Rendered in: `client/src/pages/restaurant/BrowseProducts.jsx`.
- **Test / Verification**: Tested via Vite production build (`cd client && npm run build`).

---

### 9. Frontend Product Browsing Integration
- **Path**: `client/src/pages/restaurant/BrowseProducts.jsx`
- **Status**: Modified
- **Responsibility**: Primary restaurant product catalogue and RFQ creation interface. Embedded `ProductRecommendations` dynamically above supplier listings when a product is selected or filtered.
- **Key Modifications**:
  - Added import of `ProductRecommendations`.
  - Maintained dismissed recommendation state per session to respect user preference.
  - Implemented `handleSelectRecommendation`: allows restaurant to inspect or immediately initiate RFQ supplier comparison on recommended companion items without submitting premature orders or violating single-item RFQ conventions.
- **Connections**:
  - Consumes: `client/src/components/recommendations/ProductRecommendations.jsx`.
- **Test / Verification**: Tested via Vite production build (`cd client && npm run build`).

---

## Module 2: Intelligent RFQ, Quotation, and Order Ranking

### 1. Quotation Ranking Backend Service
- **Path**: `server/src/services/quotationRanking.service.js`
- **Status**: New
- **Responsibility**: Pure read-only quotation ranking engine evaluating bids for a given RFQ against a 5-factor weighted scoring formula (Effective Price: 40%, Delivery Suitability: 25%, Stock Availability: 20%, Supplier Delivery Reliability: 10%, Validity Window: 5%). Handles missing dates/history explicitly with neutral scoring and human-readable explanations. Performs deterministic stable sorting.
- **Key Functions / Exports**:
  - `rankQuotationsForRFQ(rfqId, restaurantId)`: Main service generating ranked and explainable quotes.
  - `getSupplierReliability(supplierId)`: Calculates genuine completed on-time rate; flags `< 3` orders as insufficient history.
  - `calculateDeliveryScore(estimatedDelivery, requiredBy)`: Evaluates deadline suitability with late penalties.
  - `calculateStockScore(currentStock, requiredQuantity)`: Evaluates full, partial, or out-of-stock fulfilment.
  - `calculateValidityScore(validUntil, status)`: Evaluates validity window and flags expired quotes as ineligible.
- **Connections**:
  - Consumes: `server/src/models/rfq.model.js`, `server/src/models/quotation.model.js`, `server/src/models/order.model.js`, `server/src/models/product.model.js`.
  - Invoked by: `server/src/controllers/procurementRanking.controller.js`.
- **API Endpoint**: Internal Service (`GET /api/rankings/quotations/:rfqId`).
- **Test File**: `server/tests/procurementRanking.test.js` (`npx jest tests/procurementRanking.test.js`).

---

### 2. RFQ Prioritization Backend Service
- **Path**: `server/src/services/rfqPriority.service.js`
- **Status**: New
- **Responsibility**: Calculates urgency labels (Urgent, High, Normal, Low), numerical priority scores, and human-readable reasons for RFQs. Evaluates approaching delivery deadlines (`requiredBy`), expiring quotation response windows (`validUntil < 12h`), stalled quotes (`> 48h`), and action-needed states for both restaurant buyers and invited suppliers.
- **Key Functions / Exports**:
  - `prioritizeRestaurantRFQs(restaurantId)`: Prioritizes and sorts all RFQs owned by a restaurant.
  - `prioritizeSupplierRFQs(supplierId)`: Prioritizes incoming RFQ quotation requests for a supplier.
  - `evaluateRestaurantRFQPriority(rfq, quotations)`: Pure heuristic classifier for restaurant view.
  - `evaluateSupplierRFQPriority(rfq, quotation)`: Heuristic classifier for supplier view.
- **Connections**:
  - Consumes: `server/src/models/rfq.model.js`, `server/src/models/quotation.model.js`.
  - Invoked by: `server/src/controllers/procurementRanking.controller.js`.
- **API Endpoint**: Internal Service (`GET /api/rankings/rfqs`).
- **Test File**: `server/tests/procurementRanking.test.js`.

---

### 3. Order Prioritization Backend Service
- **Path**: `server/src/services/orderPriority.service.js`
- **Status**: New
- **Responsibility**: Classifies and ranks active orders according to urgency without masking overdue deliveries. Enforces that any order with `estimatedDelivery < now` receives immediate `Urgent` status and top sort order. Flags stalled confirmations (`> 24h`), approaching delivery windows, and delivered orders awaiting payment.
- **Key Functions / Exports**:
  - `prioritizeRestaurantOrders(restaurantId)`: Ranks all orders for a restaurant by delivery and confirmation urgency.
  - `prioritizeSupplierOrders(supplierId)`: Ranks orders for a supplier, highlighting orders needing confirmation.
  - `evaluateOrderPriority(order, perspective)`: Pure scoring and priority categorizer.
- **Connections**:
  - Consumes: `server/src/models/order.model.js`.
  - Invoked by: `server/src/controllers/procurementRanking.controller.js`.
- **API Endpoint**: Internal Service (`GET /api/rankings/orders`).
- **Test File**: `server/tests/procurementRanking.test.js`.

---

### 4. Procurement Ranking Controller
- **Path**: `server/src/controllers/procurementRanking.controller.js`
- **Status**: New
- **Responsibility**: HTTP handler validating MongoDB ObjectIds and user roles. Dispatches to quotation ranking, RFQ prioritization, and order prioritization services. Enforces tenant ownership isolation and returns standard JSON payloads.
- **Key Functions / Exports**:
  - `getRankedQuotations(req, res)`: Handler for `GET /api/rankings/quotations/:rfqId`.
  - `getPrioritizedRFQs(req, res)`: Handler for `GET /api/rankings/rfqs`.
  - `getPrioritizedOrders(req, res)`: Handler for `GET /api/rankings/orders`.
- **Connections**:
  - Consumes: `quotationRanking.service.js`, `rfqPriority.service.js`, `orderPriority.service.js`.
  - Mounted by: `server/src/routes/procurementRanking.routes.js`.
- **API Endpoints**:
  - `GET /api/rankings/quotations/:rfqId`
  - `GET /api/rankings/rfqs`
  - `GET /api/rankings/orders`
- **Test File**: `server/tests/procurementRanking.test.js`.

---

### 5. Procurement Ranking Routes
- **Path**: `server/src/routes/procurementRanking.routes.js`
- **Status**: New
- **Responsibility**: Express router mounting `/quotations/:rfqId`, `/rfqs`, and `/orders` endpoints. Protects all endpoints with JWT middleware and applies strict role authorization (`authorize("restaurant")` on quotation rankings to prevent suppliers from inspecting competing bids).
- **Key Functions / Exports**:
  - Express `Router()` instance.
- **Connections**:
  - Consumes: `server/src/controllers/procurementRanking.controller.js`, `server/src/middleware/auth.middleware.js`.
  - Mounted by: `server/src/app.js` under `/api/rankings`.
- **Test File**: `server/tests/procurementRanking.test.js`.

---

### 6. Order Schema & Controller (Enhancements)
- **Paths**: `server/src/models/order.model.js`, `server/src/controllers/order.controller.js`
- **Status**: Modified
- **Responsibility**: Added backward-compatible `deliveredAt: { type: Date }` field to `orderSchema` and updated `updateOrderStatus` to record the exact delivery timestamp when transitioning to `"delivered"`. Powers genuine historical on-time delivery statistics without altering existing order workflows.
- **Connections**:
  - Consumed by: `quotationRanking.service.js` for on-time rate calculations.
- **Test File**: `server/tests/procurementRanking.test.js`, `server/tests/quotation_and_order.test.js`.

---

### 7. Backend Automated Test Suite
- **Path**: `server/tests/procurementRanking.test.js`
- **Status**: New
- **Responsibility**: 9 automated test suites verifying:
  1. Lowest effective price with discounts and comparable quantities.
  2. Delivery deadline suitability and late delivery score penalties.
  3. Missing delivery dates and neutral handling of `< 3` orders historical data.
  4. Ineligible scoring (`score: 0`, `rank: null`) for expired and rejected quotations.
  5. Deterministic tie-breaking behavior for identical quotation bids.
  6. RFQ prioritization for expiring quotations, imminent deadlines, and stalled tenders.
  7. Order prioritization highlighting overdue orders without score masking.
  8. RBAC and restaurant data isolation on ranking routes (401, 403, 400).
  9. Existing quotation award and order workflows remaining fully functional.
- **How to Run**:
  ```bash
  cd server && npx jest tests/procurementRanking.test.js --runInBand
  ```

---

### 8. Frontend Ranking API Client
- **Path**: `client/src/services/procurementRankingService.js`
- **Status**: New
- **Responsibility**: Axios API service methods communicating with `/api/rankings/quotations/:rfqId`, `/api/rankings/rfqs`, and `/api/rankings/orders`.
- **Key Functions / Exports**:
  - `getRankedQuotations(rfqId)`
  - `getPrioritizedRFQs(priority)`
  - `getPrioritizedOrders(priority)`
- **Connections**:
  - Consumes: `client/src/services/api.js`.
  - Invoked by: `QuotationRanking.jsx`, `MyQuotations.jsx`, `MyOrders.jsx`, `SupplierQuotations.jsx`.
- **Test / Verification**: Tested via Vite production build.

---

### 9. Frontend Quotation Ranking Component
- **Path**: `client/src/components/ranking/QuotationRanking.jsx`
- **Status**: New
- **Responsibility**: Interactive React component for restaurant buyers to evaluate bids for an RFQ.
  - Sorting toggles: "Recommended (Smart Rank)", "Effective Price", "Delivery Time".
  - #1 Top Match badge, score pill (0-100), and breakdown of effective unit price, discount % applied, and total cost.
  - Stock fulfilment status, delivery suitability, and genuine supplier reliability (with transparent `< 3 orders` disclaimer).
  - Clear explanation string describing why the quote received its rank.
  - Preserves award workflow: "Award Bid" button invokes `acceptQuotation()` with confirmation toast and immediate state refresh.
  - Ineligible / expired bids grouped cleanly at bottom.
- **Connections**:
  - Consumes: `client/src/services/procurementRankingService.js`, `client/src/services/quotationService.js`.
  - Rendered in: `client/src/components/rfq/RFQResponsesModal.jsx`.
- **Test / Verification**: Tested via Vite production build.

---

### 10. Frontend RFQ Responses Modal (Integration)
- **Path**: `client/src/components/rfq/RFQResponsesModal.jsx`
- **Status**: Modified
- **Responsibility**: Embedded `QuotationRanking` into the RFQ responses view, adding a toggle between "Smart Ranking View" and "Standard List View", giving buyers immediate access to ranked bids.
- **Connections**:
  - Consumes: `client/src/components/ranking/QuotationRanking.jsx`.
- **Test / Verification**: Tested via Vite production build.

---

### 11. Frontend RFQ Card & List Priority Display (RFQ Terminology Alignment)
- **Paths**: `client/src/components/rfq/RFQCard.jsx`, `client/src/pages/restaurant/MyQuotations.jsx`
- **Status**: Modified
- **Responsibility**:
  - Aligned page terminology from "My Quotations" to "My RFQs" with subtitle: "Track your procurement requests, supplier responses, and priorities."
  - Updated filter tabs to RFQ context: "All RFQs", "Urgent", "Ready for Review", "Awaiting Responses", "Completed".
  - Preserved underlying filter logic, response counts, priority badges, and `View Responses & Rankings` action.
  - Updated empty states and error toast messaging to RFQ terminology.
- **Test / Verification**: Tested via Vite production build.

---

### 12. Frontend Order Priority Display (Restaurant & Supplier)
- **Paths**: `client/src/pages/restaurant/MyOrders.jsx`, `client/src/components/order/RestaurantOrderCard.jsx`, `client/src/pages/supplier/MyOrders.jsx`, `client/src/components/order/OrderCard.jsx`
- **Status**: Modified
- **Responsibility**:
  - Updated both `MyOrders.jsx` pages to fetch from `getPrioritizedOrders()`, displaying prominent top alert banners when urgent/overdue orders exist.
  - Updated `RestaurantOrderCard.jsx` and `OrderCard.jsx` to display priority badges and reason explanations.
- **Test / Verification**: Tested via Vite production build.

---

### 13. Frontend Supplier Incoming Quotations (Integration)
- **Paths**: `client/src/pages/supplier/SupplierQuotations.jsx`, `client/src/components/quotation/SupplierQuotationCard.jsx`
- **Status**: Modified
- **Responsibility**:
  - Updated `SupplierQuotations.jsx` to fetch prioritized quotation requests, prioritizing pending requests with imminent delivery deadlines or aged response times.
  - Enhanced `SupplierQuotationCard.jsx` with urgency badges and priority alerts.
- **Test / Verification**: Tested via Vite production build.

---

### 14. Full-Height Sticky Sidebar & Layout Fixes
- **Paths**: `client/src/components/layout/restaurant/RestaurantSidebar.jsx`, `client/src/components/layout/restaurant/RestaurantLayout.jsx`, `client/src/components/layout/supplier/SupplierSidebar.jsx`, `client/src/components/layout/supplier/SupplierLayout.jsx`
- **Status**: Modified
- **Responsibility**:
  - Renamed sidebar navigation item from "My Quotations" to "My RFQs" for `/restaurant/rfqs`, maintaining exact active NavLink highlight state.
  - Resolved sidebar height cut-off bug: replaced non-sticky `h-screen` with `sticky top-0 h-screen w-64 flex-shrink-0 z-20` and `overflow-y-auto` nav container.
  - Added `min-w-0` to main flex column wrappers preventing horizontal layout blowouts.
  - Ensured the sidebar spans the full viewport height continuously as long pages scroll, eliminating blank white space below the sidebar.
- **Test / Verification**: Tested via Vite production build.

---

## Module 3: Supplier Smart Replenishment and Demand Forecasting

### 1. Supplier Demand History Aggregation Service
- **Path**: `server/src/services/supplierDemandHistory.service.js`
- **Status**: New
- **Responsibility**: Aggregates supplier-specific demand history across all legitimate restaurant orders placed for the supplier's products.
  - Excludes cancelled, rejected, unpaid, or refunded orders (`orderStatus: { $nin: ["cancelled", "rejected"] }`, `paymentStatus: { $nin: ["failed", "refunded"] }`).
  - Distinguishes delivered purchases (fulfilled historical demand) from active in-flight orders (`confirmed`, `preparing`, `out_for_delivery` which represent committed demand).
  - Strictly enforces measurement unit integrity: never combines incompatible units (e.g. kg vs pieces) under the same product name.
  - Enforces tenant privacy: masks and strips all private restaurant identities, restaurant IDs, and quotation negotiation history.
  - Scoped strictly to the authenticated `supplierId` (complete cross-supplier isolation).
  - Handles catalog products with zero orders, unlinked historical orders, and corrupted timestamps safely.
- **Key Functions / Exports**:
  - `getSupplierDemandHistory(supplierId)`: Returns aggregated, chronological demand histories grouped by supplier catalog product.
- **Connections**:
  - Consumes: `server/src/models/order.model.js`, `server/src/models/product.model.js`.
  - Invoked by: `server/src/services/smartReplenishment.service.js`.
- **API Endpoint**: Internal Service.
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 2. Baseline Demand Forecasting Service
- **Path**: `server/src/services/demandForecast.service.js`
- **Status**: New
- **Responsibility**: Pure, defensible baseline demand forecasting engine evaluated on the supplier's chronological order stream.
  - Requires at least 5 qualifying completed orders before evaluating forecasting feasibility. If `< 5` observations exist, explicitly reports `isAvailable: false` with insufficient data reasoning.
  - Enforces strict chronological walk-forward validation (predicting observation $t_k$ exclusively from $t_0 \dots t_{k-1}$), strictly forbidding random splits or future-to-past data leakage.
  - Evaluates three simple, explainable baseline models on order demand volume: Naive (last observed quantity), Historical Median, and EWMA ($\alpha = 0.35$).
  - Computes and publishes out-of-sample Mean Absolute Error (MAE) and sample size for each model, identifying the winning baseline.
  - Estimates projected 30-day purchasing requirements based on the median reorder cadence and median quantity.
  - Includes prominent domain disclaimers: informs suppliers that estimates reflect historical buyer order patterns; upstream farm delivery delays and external macroeconomic factors are unobserved. Avoids all false claims of AI or machine learning.
- **Key Functions / Exports**:
  - `evaluateChronologicalForecast(deliveredOrders)`: Runs walk-forward validation and calculates 30-day projected requirements.
- **Connections**:
  - Consumes: Historical purchase events from `supplierDemandHistory.service.js`.
  - Invoked by: `server/src/services/smartReplenishment.service.js`.
- **API Endpoint**: Internal Service.
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 3. Supplier Smart Replenishment Engine Service
- **Path**: `server/src/services/smartReplenishment.service.js`
- **Status**: New
- **Responsibility**: Orchestrates supplier replenishment calculations and separates four distinct architectural dimensions:
  1. **Historical Demand Measurements**: Order counts, delivered units, in-flight committed units, median order quantity, median reorder interval (days), and daily demand rate.
  2. **Estimated Future Demand**: Projected 14-day and 30-day demand derived from historical median order volume and reorder cadence.
  3. **Supplier Inventory and Projected Stock Risk**: Measures actual warehouse on-hand stock (`Product.stock`), committed in-flight stock, days of stock remaining (`currentStock / dailyDemandRate`), and categorizes stock risk (`stockout_risk`, `low_stock`, `adequate`, `insufficient_data`).
  4. **Suggested Replenishment Quantity**: Defensible deficit calculation ($\max(0, \text{projected30DayDemand} - \text{currentStock})$). When stock is adequate, suggests 0. When data is insufficient ($< 2$ orders), returns `null` and states limitations without fabricating numbers.
- **Key Functions / Exports**:
  - `getSupplierReplenishmentRecommendations(supplierId, options)`: Returns summary overview and detailed per-product replenishment recommendations.
- **Connections**:
  - Consumes: `server/src/services/supplierDemandHistory.service.js`, `server/src/services/demandForecast.service.js`, `server/src/models/product.model.js`.
  - Invoked by: `server/src/controllers/smartReplenishment.controller.js`.
- **API Endpoint**: Internal Service.
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 4. Smart Replenishment Controller
- **Path**: `server/src/controllers/smartReplenishment.controller.js`
- **Status**: New
- **Responsibility**: HTTP request controller handling `GET /api/replenishment/recommendations`.
  - Enforces supplier role authorization (`req.user.role === "supplier"`).
  - Retrieves authenticated supplier ID from verified JWT session (`req.user.id`).
  - Validates and sanitizes optional query filters (`status`, `category`, `search`).
  - Returns consistent, standardized JSON payloads with HTTP 200/400/403/500 status codes.
- **Key Functions / Exports**:
  - `getRecommendations(req, res)`: Handler for supplier replenishment recommendations.
- **Connections**:
  - Consumes: `server/src/services/smartReplenishment.service.js`.
  - Mounted by: `server/src/routes/smartReplenishment.routes.js`.
- **API Endpoints**:
  - `GET /api/replenishment/recommendations`
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 5. Smart Replenishment Routes
- **Path**: `server/src/routes/smartReplenishment.routes.js`
- **Status**: New
- **Responsibility**: Express router mounting `/recommendations` under `/api/replenishment`. Protected by JWT authentication (`protect`) and supplier role authorization (`authorize("supplier")`).
- **Key Functions / Exports**:
  - Express `Router()` instance.
- **Connections**:
  - Consumes: `server/src/controllers/smartReplenishment.controller.js`, `server/src/middleware/auth.middleware.js`.
  - Mounted by: `server/src/app.js`.
- **API Endpoints**:
  - `GET /api/replenishment/recommendations`
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 6. Backend Server App Registration
- **Path**: `server/src/app.js`
- **Status**: Modified
- **Responsibility**: Mounted `replenishmentRoutes` under `/api/replenishment`.
- **Connections**:
  - Imports: `server/src/routes/smartReplenishment.routes.js`.
- **Test File**: `server/tests/smartReplenishment.test.js`.

---

### 7. Backend Automated Test Suite
- **Path**: `server/tests/smartReplenishment.test.js`
- **Status**: New
- **Responsibility**: 14 automated unit and integration tests verifying:
  1. Aggregation of authentic demand history across multiple restaurant buyers for supplier products.
  2. Exclusion of cancelled, rejected, failed payment, and refunded orders from demand calculations.
  3. Safe handling of products with zero orders, reporting on-hand stock and no-demand status.
  4. Honest reporting of insufficient history without fabricating replenishment quantities when only 1 order exists.
  5. Calculation of accurate median order intervals and daily demand rates across multiple purchases.
  6. Detection of critical stockout risk when on-hand stock is low or zero relative to demand.
  7. Detection of adequate stock and calculation of 0 replenishment quantity when stock exceeds projected demand.
  8. Suggested replenishment deficit calculation (`projected30DayDemand - currentStock`) when warehouse stock is insufficient.
  9. Strict data privacy preservation by stripping restaurant identities and private IDs.
  10. Measurement unit integrity preventing conflation of incompatible units for the same supplier.
  11. Strict tenant isolation preventing cross-supplier data leakage.
  12. Forward-facing chronological walk-forward validation and model comparison when $\ge 5$ orders exist.
  13. RBAC security enforcement: 401 for unauthenticated requests, 403 for restaurants, 200 for suppliers.
  14. Query parameter filtering by stock risk status and search terms.
- **How to Run**:
  ```bash
  cd server && npm test tests/smartReplenishment.test.js
  ```

---

### 8. Frontend Replenishment Service Client
- **Path**: `client/src/services/smartReplenishmentService.js`
- **Status**: New
- **Responsibility**: Axios client module communicating with `GET /api/replenishment/recommendations`. Handles query parameter serialization (`status`, `category`, `search`) and error sanitization for the authenticated supplier.
- **Key Functions / Exports**:
  - `getSupplierReplenishmentRecommendations(params)`: Calls `/api/replenishment/recommendations`.
  - `getReplenishmentRecommendations(params)`: Backwards-compatible alias.
- **Connections**:
  - Consumes: `client/src/services/api.js`.
  - Invoked by: `client/src/pages/supplier/SmartReplenishment.jsx`.
- **Test / Verification**: Tested via Vite production build.

---

### 9. Frontend Dedicated Supplier Replenishment Page
- **Path**: `client/src/pages/supplier/SmartReplenishment.jsx`
- **Status**: New
- **Responsibility**: Comprehensive supplier inventory and demand intelligence dashboard:
  - **Overview Metrics**: Displays total monitored products, critical stockout risk, low stock alert, adequate stock, and insufficient history.
  - **Transparent Methodology Notice**: Explains that warehouse stock is measured from catalog inventory and demand is aggregated across verified restaurant orders, clearly stating lead time assumptions.
  - **Search & Filter Controls**: Status pills ("All Items", "Stockout Risk", "Low Stock", "Adequate", "Insufficient Data") and real-time product search.
  - **Product Replenishment Cards**:
    - Risk and confidence badges (`Critical Stockout Risk`, `Low Stock`, `Adequate Stock`, `High/Moderate/Provisional Confidence`).
    - 4 distinct dimension panels: Warehouse Inventory, Historical Demand, Projected Demand, and Replenishment Plan.
    - Collapsible demand forecast section (when $\ge 5$ orders exist): Displays evaluated baseline models (Naive, Median, EWMA), out-of-sample MAE comparisons, sample size, and projected 30-day requirement.
    - Direct "Update Stock" modal: Allows supplier to update live warehouse stock via `updateProduct` with instant state refresh.
  - Full loading skeleton, error retry, and empty states.
- **Connections**:
  - Consumes: `client/src/services/smartReplenishmentService.js`, `client/src/services/productService.js`, `lucide-react`.
  - Route: `/supplier/replenishment` in `client/src/routes/AppRoutes.jsx`.
- **Test / Verification**: Tested via Vite production build.

---

### 10. Navigation & Dashboard Integration
- **Paths**: `client/src/components/layout/supplier/SupplierSidebar.jsx`, `client/src/routes/AppRoutes.jsx`, `client/src/components/dashboard/QuickActions.jsx`, `client/src/components/layout/restaurant/RestaurantSidebar.jsx`
- **Status**: Modified
- **Responsibility**:
  - `SupplierSidebar.jsx`: Added "Replenishment & Demand" navigation item with `TrendingUp` icon pointing to `/supplier/replenishment`.
  - `AppRoutes.jsx`: Registered protected route `/supplier/replenishment` restricted to `supplier` role.
  - `QuickActions.jsx`: Added "Smart Replenishment" quick action card for suppliers; cleaned restaurant quick actions.
  - `RestaurantSidebar.jsx`: Removed restaurant-facing replenishment navigation item.
- **Test / Verification**: Tested via Vite production build.

## Module 4: Automated Procurement Notifications
*(Pending Phase 4 implementation)*

