const express = require('express')
const router = express.Router()
const appealController = require('../controllers/appealController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), appealController.getList)
router.get('/pending-count', authMiddleware(), appealController.getPendingCount)
router.get('/:id', authMiddleware(), appealController.getDetail)
router.post('/', authMiddleware(), appealController.create)
router.put('/:id/review', authMiddleware(), roleMiddleware(['admin', 'auditor']), appealController.review)

module.exports = router
