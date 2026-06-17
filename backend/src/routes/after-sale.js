const express = require('express')
const router = express.Router()
const afterSaleController = require('../controllers/afterSaleController')
const { requireRole } = require('../middleware/auth')

router.get('/', afterSaleController.getList)
router.get('/statistics', afterSaleController.getStatistics)
router.get('/:id', afterSaleController.getDetail)
router.get('/prerequisites/:orderId', afterSaleController.getPrerequisites)
router.post('/submit/:orderId', afterSaleController.submitAfterSale)
router.get('/logs/:ticketId', afterSaleController.getAuditLogs)
router.get('/batch/preview', requireRole([1, 6]), afterSaleController.getBatchPreview)
router.post('/batch', requireRole([1, 6]), afterSaleController.batchOperation)
router.get('/trace/:id', afterSaleController.getTrace)
router.get('/reputation/:passengerId', afterSaleController.getReputationRecords)

router.put('/process/:id', requireRole([1, 2, 6]), afterSaleController.processTicket)
router.put('/resolve/:id', requireRole([1, 2, 6]), afterSaleController.resolveTicket)
router.put('/reject/:id', requireRole([1, 2, 6]), afterSaleController.rejectTicket)
router.put('/close/:id', requireRole([1, 6]), afterSaleController.closeTicket)

module.exports = router
