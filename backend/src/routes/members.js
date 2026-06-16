const express = require('express')
const router = express.Router()
const memberController = require('../controllers/memberController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), roleMiddleware(['super_admin', 'admin']), memberController.getList)
router.get('/:id', authMiddleware(), roleMiddleware(['super_admin', 'admin']), memberController.getDetail)
router.put('/:id/level', authMiddleware(), roleMiddleware(['super_admin', 'admin']), memberController.updateLevel)

module.exports = router
