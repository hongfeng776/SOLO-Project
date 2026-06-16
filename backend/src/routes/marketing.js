const express = require('express')
const router = express.Router()
const marketingController = require('../controllers/marketingController')

router.get('/statistics/:id', marketingController.getStatistics)
router.get('/', marketingController.getList)
router.get('/:id', marketingController.getDetail)
router.post('/', marketingController.create)
router.put('/:id', marketingController.update)
router.delete('/:id', marketingController.delete)
router.put('/:id/status', marketingController.updateStatus)

module.exports = router
