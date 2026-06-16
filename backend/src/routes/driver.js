const express = require('express')
const router = express.Router()
const driverController = require('../controllers/driverController')

router.get('/', driverController.getList)
router.get('/audit/pending-count', driverController.getPendingAuditCount)
router.get('/:id', driverController.getDetail)
router.post('/', driverController.create)
router.put('/:id', driverController.update)
router.delete('/:id', driverController.delete)
router.put('/:id/status', driverController.updateStatus)
router.put('/:id/audit', driverController.audit)

module.exports = router
