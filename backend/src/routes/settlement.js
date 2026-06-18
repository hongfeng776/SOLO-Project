const express = require('express')
const router = express.Router()
const settlementController = require('../controllers/settlementController')

router.get('/list', settlementController.getSettlementList)
router.get('/statistics', settlementController.getStatistics)
router.get('/generate-voucher', settlementController.generateVoucher)

router.post('/', settlementController.createSettlement)
router.post('/batch-initiate', settlementController.batchInitiate)
router.post('/batch-audit', settlementController.batchAudit)
router.post('/batch-reject', settlementController.batchReject)
router.post('/calculate-income', settlementController.calculateOrderIncome)

router.get('/rules', settlementController.getRuleList)
router.post('/rules/pre-check', settlementController.preCheckRule)
router.post('/rules/check-exclusive', settlementController.checkExclusiveRule)
router.post('/rules/estimate-income', settlementController.estimateIncome)
router.post('/rules', settlementController.createRule)
router.put('/rules/:id', settlementController.updateRule)
router.delete('/rules/:id', settlementController.deleteRule)

router.get('/:id', settlementController.getSettlementDetail)
router.put('/:id/initiate', settlementController.initiateSettlement)
router.put('/:id/audit', settlementController.auditSettlement)
router.put('/:id/post', settlementController.postSettlement)

module.exports = router
