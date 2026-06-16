const express = require('express')
const router = express.Router()
const systemController = require('../controllers/systemController')

router.get('/user', systemController.getUserList)
router.get('/user/:id', systemController.getUserDetail)
router.post('/user', systemController.createUser)
router.put('/user/:id', systemController.updateUser)
router.delete('/user/:id', systemController.deleteUser)
router.put('/user/:id/status', systemController.updateUserStatus)

router.get('/role', systemController.getRoleList)
router.get('/role/:id', systemController.getRoleDetail)
router.post('/role', systemController.createRole)
router.put('/role/:id', systemController.updateRole)
router.delete('/role/:id', systemController.deleteRole)

router.get('/menu', systemController.getMenuList)

module.exports = router
