// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');
const verifyToken = require('../middleware/verifyToken'); // middleware xác thực JWT

router.post('/create-supplier', verifyToken, isAdmin, adminController.createSupplierAccount);
// router.put('/approve-supplier/:supplierId', verifyToken, isAdmin, adminController.approveSupplier);

module.exports = router;
