const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const logRoutes = require('./log');

router.use('/auth', authRoutes);
router.use('/logs', logRoutes);

module.exports = router;
