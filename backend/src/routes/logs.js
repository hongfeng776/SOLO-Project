const express = require('express')
const router = express.Router()
const logController = require('../controllers/logController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), roleMiddleware(['admin']), logController.getList)
router.get('/stats', authMiddleware(), roleMiddleware(['admin']), logController.getStats)
router.post('/', authMiddleware(), logController.create)

module.exports = router
