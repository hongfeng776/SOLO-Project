const express = require('express')
const router = express.Router()
const recycleController = require('../controllers/recycleController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/', authMiddleware(), recycleController.getList)
router.get('/pending-count', authMiddleware(), recycleController.getPendingCount)
router.get('/:id', authMiddleware(), recycleController.getDetail)

router.get('/validate-discard/:resourceId', authMiddleware(), recycleController.validateDiscard)
router.post('/submit-discard/:resourceId', authMiddleware(), recycleController.submitDiscard)
router.post('/batch-discard', authMiddleware(), recycleController.batchDiscard)

router.put('/:id/review', authMiddleware(), roleMiddleware(['super_admin', 'admin']), recycleController.reviewDiscard)

router.get('/:id/validate-restore', authMiddleware(), recycleController.validateRestore)
router.post('/:id/restore', authMiddleware(), roleMiddleware(['super_admin', 'admin']), recycleController.restoreResource)
router.post('/batch-restore', authMiddleware(), roleMiddleware(['super_admin', 'admin']), recycleController.batchRestore)

module.exports = router
