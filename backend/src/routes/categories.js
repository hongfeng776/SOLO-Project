const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), categoryController.getList)
router.get('/tree', authMiddleware(), categoryController.getTree)
router.get('/:id', authMiddleware(), categoryController.getDetail)
router.post('/', authMiddleware(), categoryController.create)
router.put('/:id', authMiddleware(), categoryController.update)
router.delete('/:id', authMiddleware(), categoryController.delete)

module.exports = router
