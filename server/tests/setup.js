process.env.JWT_SECRET = "test_jwt_secret_super_secure_12345";
process.env.RAZORPAY_KEY_ID = "rzp_test_sample_key";
process.env.RAZORPAY_KEY_SECRET = "sample_razorpay_secret_1234567890";
process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
};
