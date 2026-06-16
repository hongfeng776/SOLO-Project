const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/auth')

router.post('/login', authController.login)
router.post('/logout', authMiddleware(), authController.logout)
router.get('/userinfo', authMiddleware(), authController.getUserInfo)
router.post('/register', authController.register)
router.post('/refresh', authMiddleware(), authController.refreshToken)

module.exports = router
