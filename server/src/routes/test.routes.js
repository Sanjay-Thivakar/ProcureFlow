const express = require("express");
const router = express.Router();

const { testPost } = require("../controllers/test.controller");

router.post("/test", testPost);

module.exports = router;