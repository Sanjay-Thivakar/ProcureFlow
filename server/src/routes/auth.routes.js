// maps the urls to the controller functions
const express = require("express");

const router = express.Router();
const { protect } = require("../middleware/auth.middleware");


//this checks the login of the user using JWT 
const { register, login, profile} = require("../controllers/auth.controller");



router.get("/profile", protect, profile);



router.post("/register", register);


router.post("/login", login);

module.exports = router;