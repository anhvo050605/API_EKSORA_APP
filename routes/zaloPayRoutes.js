const express = require("express");
const router = express.Router();
const zaloPayController = require("../controllers/zaloPayController");

// Tạo link thanh toán
router.post("/create-order", zaloPayController.createZaloPayOrder);
router.get("/query", zaloPayController.queryZaloPayOrder);

module.exports = router;
