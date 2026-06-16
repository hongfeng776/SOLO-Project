const express = require('express')
const router = express.Router()
const passengerController = require('../controllers/passengerController')

router.get('/', passengerController.getList)
router.get('/:id', passengerController.getDetail)
router.post('/', passengerController.create)
router.put('/:id', passengerController.update)
router.delete('/:id', passengerController.delete)
router.put('/:id/status', passengerController.updateStatus)

module.exports = router
