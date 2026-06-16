const express = require('express')
const router = express.Router()
const capacityController = require('../controllers/capacityController')

router.get('/monitor', capacityController.getMonitor)
router.get('/type', capacityController.getTypeList)
router.get('/type/:id', capacityController.getTypeDetail)
router.post('/type', capacityController.createType)
router.put('/type/:id', capacityController.updateType)
router.delete('/type/:id', capacityController.deleteType)

module.exports = router
