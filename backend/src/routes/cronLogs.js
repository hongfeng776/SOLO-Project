const express = require('express')
const router = express.Router()
const { auth, authOptional } = require('../middlewares/auth')
const controller = require('../controllers/cronLogController')

router.get('/validate', authOptional, controller.validateParams)

router.get('/task-types', authOptional, controller.getTaskTypeList)
router.get('/statuses', authOptional, controller.getStatusList)
router.get('/trigger-types', authOptional, controller.getTriggerTypeList)
router.get('/task-names', authOptional, controller.getTaskNameList)
router.get('/task-groups', authOptional, controller.getTaskGroupList)

router.get('/stats', auth, controller.getStats)
router.get('/batch-stats', auth, controller.getBatchStats)
router.get('/traceability', auth, controller.getTraceability)

router.get('/:id', auth, controller.getDetail)

router.post('/', auth, controller.create)

router.get('/', auth, controller.getList)

module.exports = router
