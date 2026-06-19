const express = require('express')
const router = express.Router()
const cronLogController = require('../controllers/cronLogController')

router.get('/validate', cronLogController.validateParams)
router.get('/types', cronLogController.getTypeList)
router.get('/statuses', cronLogController.getStatusList)
router.get('/trigger-types', cronLogController.getTriggerTypeList)
router.get('/anomaly-types', cronLogController.getAnomalyTypeList)
router.get('/retry-strategies', cronLogController.getRetryStrategyList)
router.get('/tasks', cronLogController.getTaskList)
router.get('/stats', cronLogController.getStats)
router.get('/traceability', cronLogController.getTraceability)
router.get('/:id', cronLogController.getDetail)
router.get('/', cronLogController.getList)
router.post('/', cronLogController.create)

module.exports = router
