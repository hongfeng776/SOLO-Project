import { Router } from 'express'
import * as noteOpsLogController from '@controllers/note-ops-log'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/stats', noteOpsLogController.getStats)
router.get('/', noteOpsLogController.list)
router.get('/:id', noteOpsLogController.detail)

export default router
