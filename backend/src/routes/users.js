const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.getList)
router.get('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.getDetail)
router.post('/', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.create)
router.put('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.update)
router.delete('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.delete)
router.post('/batch-delete', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.batchDelete)
router.put('/:id/status', authMiddleware(), roleMiddleware(['super_admin', 'admin']), userController.updateStatus)

module.exports = router
