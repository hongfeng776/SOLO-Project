const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/auth');

router.get('/operation', authMiddleware, logController.getLogList);
router.get('/operation/:id', authMiddleware, logController.getLogDetail);

module.exports = router;
