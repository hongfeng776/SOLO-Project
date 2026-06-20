const express = require('express')
const router = express.Router()
const filterController = require('../controllers/filterController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), filterController.getList)
router.get('/trace', authMiddleware(), filterController.traceFilter)
router.post('/validate', authMiddleware(), filterController.validateCreate)
router.post('/entry', authMiddleware(), roleMiddleware('super_admin', 'admin', 'operator'), filterController.createWithValidation)
router.post('/batch-entry', authMiddleware(), roleMiddleware('super_admin', 'admin', 'operator'), filterController.batchValidateAndSubmit)
router.get('/:id/edit-logs', authMiddleware(), filterController.getEditLogs)
router.get('/:id', authMiddleware(), filterController.getDetail)
router.put('/:id/constrain', authMiddleware(), filterController.updateWithConstraint)
router.put('/:id/status', authMiddleware(), filterController.updateStatus)
router.delete('/:id', authMiddleware(), filterController.delete)

module.exports = router
