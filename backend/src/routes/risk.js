const express = require('express')
const router = express.Router()
const riskController = require('../controllers/riskController')

router.get('/rules', riskController.getRules)
router.get('/rules/:id', riskController.getRuleDetail)
router.post('/rules', riskController.createRule)
router.put('/rules/:id', riskController.updateRule)
router.delete('/rules/:id', riskController.deleteRule)
router.put('/rules/:id/toggle', riskController.toggleRule)
router.get('/records', riskController.getRecords)
router.put('/records/:id', riskController.handleRecord)
router.get('/dashboard', riskController.getDashboard)
router.post('/check-order', riskController.checkOrder)

module.exports = router
