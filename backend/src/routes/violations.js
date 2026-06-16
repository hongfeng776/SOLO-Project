const express = require('express')
const router = express.Router()
const violationController = require('../controllers/violationController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), violationController.getList)
router.get('/stats', authMiddleware(), violationController.getStats)
router.get('/:id', authMiddleware(), violationController.getDetail)
router.post('/', authMiddleware(), roleMiddleware(['admin', 'auditor']), violationController.create)
router.put('/:id/handle', authMiddleware(), roleMiddleware(['admin', 'auditor']), violationController.handleViolation)
router.post('/batch-handle', authMiddleware(), roleMiddleware(['admin', 'auditor']), violationController.batchHandle)

module.exports = router
