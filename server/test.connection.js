const mongoose = require("mongoose");

const uri = "mongodb+srv://sanjay_thivakar:sanjay@cluster0.n55npuj.mongodb.net/?appName=Cluster0";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });