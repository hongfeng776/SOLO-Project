const express = require('express')
const router = express.Router()
const resourceController = require('../controllers/resourceController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), resourceController.getList)
router.get('/:id', authMiddleware(), resourceController.getDetail)
router.post('/', authMiddleware(), resourceController.create)
router.put('/:id', authMiddleware(), resourceController.update)
router.delete('/:id', authMiddleware(), resourceController.delete)
router.post('/batch-delete', authMiddleware(), resourceController.batchDelete)
router.put('/:id/status', authMiddleware(), resourceController.updateStatus)
router.post('/batch-status', authMiddleware(), resourceController.batchUpdateStatus)
router.post('/:id/submit-audit', authMiddleware(), resourceController.submitForAudit)

module.exports = router
