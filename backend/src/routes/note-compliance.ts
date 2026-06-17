import { Router } from 'express'
import * as noteComplianceController from '@controllers/note-compliance'
import { authMiddleware, optionalAuth } from '@middlewares/auth'

const router = Router()

router.post('/check', optionalAuth, noteComplianceController.checkContent)
router.post('/similarity', authMiddleware, noteComplianceController.checkSimilarity)
router.post('/schedule', authMiddleware, noteComplianceController.checkSchedule)

export default router
