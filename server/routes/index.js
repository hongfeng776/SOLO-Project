const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const logRoutes = require('./log');
const silhouetteRoutes = require('./silhouette');
const visualTemplateRoutes = require('./visualTemplate');

router.use('/auth', authRoutes);
router.use('/logs', logRoutes);
router.use('/silhouettes', silhouetteRoutes);
router.use('/visual-templates', visualTemplateRoutes);

module.exports = router;
