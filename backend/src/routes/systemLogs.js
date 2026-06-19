const express = require('express')
const router = express.Router()
const { auth, authOptional } = require('../middlewares/auth')
const controller = require('../controllers/systemLogController')

router.get('/validate', authOptional, controller.validateParams)

router.get('/types', authOptional, controller.getTypeList)
router.get('/levels', authOptional, controller.getLevelList)
router.get('/modules', authOptional, controller.getModuleList)

router.get('/permission', auth, controller.getPermission)

router.get('/stats', auth, controller.getStats)

router.get('/traceability', auth, controller.getTraceability)

router.get('/:id', auth, controller.getDetail)

router.post('/', auth, controller.create)

router.post('/backup', auth, controller.backupLogs)
router.post('/cleanup', auth, controller.cleanupLogs)

router.get('/', auth, controller.getList)

module.exports = router
