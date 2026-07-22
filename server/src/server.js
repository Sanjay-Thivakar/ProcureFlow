require("dotenv").config();



const app = require("./app");

const PORT = process.env.PORT;

const connectDB = require("./config/db");

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

};

startServer();