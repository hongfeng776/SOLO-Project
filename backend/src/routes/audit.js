const express = require('express')
const router = express.Router()
const auditController = require('../controllers/auditController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/pending', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.getPendingList)
router.get('/records', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.getRecords)
router.get('/stats', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.getAuditStats)
router.get('/violation-stats', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.getViolationStats)
router.post('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.auditResource)
router.post('/batch', authMiddleware(), roleMiddleware(['super_admin', 'admin', 'auditor']), auditController.batchAudit)

module.exports = router
