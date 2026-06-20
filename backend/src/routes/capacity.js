const express = require('express')
const router = express.Router()
const capacityController = require('../controllers/capacityController')
const { authenticate, requireRole } = require('../middleware/auth')

router.get('/monitor', authenticate, capacityController.getMonitor)
router.get('/status-detail', authenticate, capacityController.getCapacityStatusDetail)
router.post('/batch-dispatch', authenticate, requireRole('admin', 'capacity_manager', 'city_manager'), capacityController.batchDispatch)
router.get('/trend', authenticate, capacityController.getCapacityTrend)
router.post('/report', authenticate, requireRole('admin', 'capacity_manager'), capacityController.generateReport)

router.get('/type', authenticate, capacityController.getTypeList)
router.get('/type/:id', authenticate, capacityController.getTypeDetail)
router.post('/type', authenticate, requireRole('admin', 'capacity_manager'), capacityController.createType)
router.put('/type/:id', authenticate, requireRole('admin', 'capacity_manager'), capacityController.updateType)
router.delete('/type/:id', authenticate, requireRole('admin', 'capacity_manager'), capacityController.deleteType)

router.post('/smart-dispatch/precheck', authenticate, capacityController.smartDispatchPrecheck)
router.post('/smart-dispatch/match', authenticate, requireRole('admin', 'capacity_manager', 'city_manager'), capacityController.smartMatchDispatch)
router.post('/smart-dispatch/batch', authenticate, requireRole('admin', 'capacity_manager', 'city_manager'), capacityController.batchSmartDispatch)
router.get('/smart-dispatch/trace', authenticate, capacityController.getDispatchTrace)

module.exports = router
