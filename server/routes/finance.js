// server/routes/finance.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { analyzeFinance } = require('../controllers/finance');

const router = express.Router();

router.route('/analyze')
  .post(protect, analyzeFinance);

module.exports = router;