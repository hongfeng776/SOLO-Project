const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const logRoutes = require('./log');
const silhouetteRoutes = require('./silhouette');

router.use('/auth', authRoutes);
router.use('/logs', logRoutes);
router.use('/silhouettes', silhouetteRoutes);

module.exports = router;
