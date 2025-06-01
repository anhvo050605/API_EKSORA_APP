const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/payment-request", paymentController.createPaymentRequest);
router.get("/payment-request/:id", paymentController.getPaymentById);
router.post("/payment-request/:id/cancel", paymentController.cancelPaymentRequest);
router.post("/webhook", paymentController.confirmWebhook);

module.exports = router;
