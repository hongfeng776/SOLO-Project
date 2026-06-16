const express = require('express')
const router = express.Router()
const vehicleController = require('../controllers/vehicleController')

router.get('/', vehicleController.getList)
router.get('/:id', vehicleController.getDetail)
router.post('/', vehicleController.create)
router.put('/:id', vehicleController.update)
router.delete('/:id', vehicleController.delete)
router.put('/:id/status', vehicleController.updateStatus)
router.put('/:id/audit', vehicleController.audit)

module.exports = router
