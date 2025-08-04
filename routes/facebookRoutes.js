    // routes/facebookRoutes.js

const express = require("express");
const router = express.Router();
const { facebookLogin } = require("../controllers/facebookController");

// POST /facebook-login
router.post("/facebook-login", facebookLogin);

module.exports = router;
