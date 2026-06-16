const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticketController')

router.get('/statistics', ticketController.getStatistics)
router.get('/', ticketController.getList)
router.get('/:id', ticketController.getDetail)
router.post('/', ticketController.create)
router.put('/:id', ticketController.update)
router.put('/:id/handle', ticketController.handleTicket)
router.put('/:id/close', ticketController.closeTicket)
router.put('/batch-close', ticketController.batchClose)

module.exports = router
