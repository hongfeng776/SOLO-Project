import { Router } from 'express'
import * as reviewComplianceController from '@controllers/review-compliance'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.post('/validate', reviewComplianceController.validate)
router.get('/abnormal-logs', reviewComplianceController.getAbnormalLogs)
router.post('/abnormal/:id/handle', reviewComplianceController.handleAbnormal)

export default router
