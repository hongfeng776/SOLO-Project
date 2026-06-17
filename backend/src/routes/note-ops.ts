import { Router } from 'express'
import * as noteOpsController from '@controllers/note-ops'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.post('/execute', noteOpsController.executeOps)
router.post('/batch', noteOpsController.batchOps)
router.post('/validate', noteOpsController.validateBeforeOps)
router.get('/abnormal', noteOpsController.getAbnormalOps)
router.get('/history/:noteId', noteOpsController.getNoteHistory)

export default router
