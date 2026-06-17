import { Router } from 'express'
import * as categoryController from '@controllers/category'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', categoryController.list)
router.get('/tree', categoryController.tree)
router.get('/all', categoryController.all)
router.get('/stats/summary', categoryController.getStats)
router.get('/:id', categoryController.detail)
router.post('/', categoryController.create)
router.put('/:id', categoryController.update)
router.delete('/:id', categoryController.remove)
router.patch('/:id/status', categoryController.updateStatus)

export default router
