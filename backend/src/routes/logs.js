const express = require('express')
const router = express.Router()
const logController = require('../controllers/logController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/validate', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.validateParams)
router.get('/', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getList)
router.get('/stats', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getStats)
router.get('/operators', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getOperators)
router.get('/modules', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getModuleList)
router.get('/actions', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getActionList)
router.get('/trace/:traceId', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getTrace)
router.get('/trace-by-log/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getTraceByLogId)
router.get('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.getDetail)
router.post('/', authMiddleware(), logController.create)
router.post('/validate-export', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.validateExport)
router.post('/export', authMiddleware(), roleMiddleware(['super_admin', 'admin']), logController.exportLogs)

module.exports = router
