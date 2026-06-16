const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/userinfo', authController.getUserInfo)
router.put('/password', authController.updatePassword)

module.exports = router
