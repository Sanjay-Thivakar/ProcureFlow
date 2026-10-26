require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express(); // creates the  express application


app.use(cors());

app.use(express.json());

const testRoutes = require("./routes/test.routes");

app.get("/", (req, res) => {
    res.send("Backend is running!");
});




const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const quotationRoutes = require("./routes/quotation.routes");
const rfqRoutes = require("./routes/rfq.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const recommendationRoutes = require("./routes/productRecommendation.routes");
const rankingRoutes = require("./routes/procurementRanking.routes");
const replenishmentRoutes = require("./routes/smartReplenishment.routes");


app.use("/api", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/replenishment", replenishmentRoutes);

module.exports = app;