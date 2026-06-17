const express = require('express')
const router = express.Router()
const pricingController = require('../controllers/pricingController')
const { requireRole } = require('../middleware/auth')

router.get('/rules', pricingController.getRuleList)
router.get('/rules/:id', pricingController.getRuleDetail)
router.post('/rules', requireRole([1]), pricingController.createRule)
router.put('/rules/:id', requireRole([1]), pricingController.updateRule)
router.delete('/rules/:id', requireRole([1]), pricingController.deleteRule)

router.get('/calculate/:orderId', pricingController.calculateBilling)
router.put('/update-billing/:orderId', requireRole([1, 2]), pricingController.updateOrderBilling)
router.get('/logs/:orderId', pricingController.getChangeLogs)
router.post('/batch-adjust', requireRole([1]), pricingController.batchAdjustPricing)
router.get('/trace/:orderId', pricingController.getBillingTrace)
router.post('/validate-edit', pricingController.validatePricingEdit)
router.get('/scenarios', pricingController.getApplicableScenarios)

module.exports = router
