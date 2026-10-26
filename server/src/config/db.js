// It connects the application to the database and returns Success or Failure
const mongoose = require("mongoose");

const connectDB = async () => {
    try {

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        await mongoose.connect(uri);

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);

        process.exit(1);
    }
};

module.exports = connectDB;