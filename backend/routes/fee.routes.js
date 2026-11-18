/**
 * Fee & Payment Routes
 */
const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Fee Structures
router.get('/structures', feeController.getFeeStructures);
router.post('/structures', authorize(ROLES.ADMIN), feeController.createFeeStructure);

// Invoices
router.get('/invoices', feeController.getInvoices);
router.get('/invoices/:id', feeController.getInvoiceById);
router.post('/invoices', authorize(ROLES.ADMIN), feeController.createInvoice);
router.post('/invoices/generate-monthly', authorize(ROLES.ADMIN), feeController.generateMonthlyInvoices);

// Payments & Receipts
router.post('/payments/record', authorize(ROLES.ADMIN), feeController.recordOfflinePayment);
router.post('/payments/simulate', authorize(ROLES.STUDENT), feeController.simulatePayment);
router.get('/receipt/:id', feeController.getReceipt);

module.exports = router;
