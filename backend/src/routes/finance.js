const express = require('express')
const router = express.Router()
const financeController = require('../controllers/financeController')

router.get('/statement', financeController.getStatementList)
router.get('/statistics', financeController.getStatistics)
router.get('/settlement', financeController.getSettlementList)
router.get('/settlement/:id', financeController.getSettlementDetail)
router.post('/settlement', financeController.createSettlement)
router.put('/settlement/:id/execute', financeController.executeSettlement)

module.exports = router
