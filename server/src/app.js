

const express = require("express"); // loads express from the express library
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


app.use("/api", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/rfqs", rfqRoutes);

module.exports = app;