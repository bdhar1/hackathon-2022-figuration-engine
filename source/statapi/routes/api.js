const express = require('express');

const statusController = require('../controllers/status');
const balanceController = require('../controllers/balance');
const ledgerController = require('../controllers/ledger');

const router = express.Router();

// /api/status => GET
router.get("/status", statusController.getStatus);
router.get("/balance", balanceController.getBalance);
router.get("/ledger", ledgerController.getLedger);
router.get("/clientcodes", ledgerController.getClientIds);

module.exports = router;