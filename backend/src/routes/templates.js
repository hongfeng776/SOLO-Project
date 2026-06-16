const express = require('express')
const router = express.Router()
const templateController = require('../controllers/templateController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), templateController.getList)
router.get('/:id', authMiddleware(), templateController.getDetail)
router.post('/', authMiddleware(), templateController.create)
router.put('/:id', authMiddleware(), templateController.update)
router.delete('/:id', authMiddleware(), templateController.delete)
router.post('/batch-delete', authMiddleware(), templateController.batchDelete)

module.exports = router
