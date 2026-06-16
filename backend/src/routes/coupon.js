const express = require('express')
const router = express.Router()
const couponController = require('../controllers/couponController')

router.get('/', couponController.getList)
router.get('/:id', couponController.getDetail)
router.post('/', couponController.create)
router.put('/:id', couponController.update)
router.delete('/:id', couponController.delete)
router.put('/:id/toggle', couponController.toggleStatus)
router.post('/distribute', couponController.distribute)

module.exports = router
