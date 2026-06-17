import { Router } from 'express'
import * as notePublishController from '@controllers/note-publish'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.post('/draft', notePublishController.saveDraft)
router.post('/publish', notePublishController.submitForPublish)
router.post('/schedule', notePublishController.schedulePublish)
router.post('/batch', notePublishController.batchPublish)
router.get('/batch-limit', notePublishController.getBatchPublishLimit)
router.post('/execute-scheduled', notePublishController.executeScheduled)

export default router
