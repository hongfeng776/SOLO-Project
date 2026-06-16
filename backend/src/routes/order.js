const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')

router.get('/', orderController.getList)
router.get('/statistics', orderController.getStatistics)
router.get('/:id', orderController.getDetail)
router.post('/', orderController.create)
router.put('/:id', orderController.update)
router.delete('/:id', orderController.delete)
router.put('/:id/status', orderController.updateStatus)
router.put('/:id/dispatch', orderController.dispatch)
router.put('/:id/cancel', orderController.cancel)
router.put('/:id/complete', orderController.completeOrder)
router.post('/batch-dispatch', orderController.batchDispatch)

module.exports = router
