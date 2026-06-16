const express = require('express')
const router = express.Router()
const analyticsController = require('../controllers/analyticsController')

router.get('/order', analyticsController.getOrderAnalytics)
router.get('/capacity', analyticsController.getCapacityAnalytics)
router.get('/user', analyticsController.getUserAnalytics)
router.get('/finance', analyticsController.getFinanceAnalytics)
router.get('/marketing', analyticsController.getMarketingAnalytics)
router.get('/risk', analyticsController.getRiskAnalytics)

module.exports = router
