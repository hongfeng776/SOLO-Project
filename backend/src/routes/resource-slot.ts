import { Router } from 'express'
import * as resourceSlotController from '@controllers/resource-slot'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', resourceSlotController.list)
router.get('/:id', resourceSlotController.detail)
router.post('/', resourceSlotController.create)
router.put('/:id', resourceSlotController.update)
router.delete('/:id', resourceSlotController.remove)
router.patch('/:id/status', resourceSlotController.updateStatus)

export default router
