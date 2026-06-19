import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'
import * as interactionOpsController from '@controllers/interaction-ops'

const router = Router()

router.use(authMiddleware)

router.get('/', interactionOpsController.list)
router.get('/stats', interactionOpsController.getStats)
router.get('/anomaly-logs', interactionOpsController.getAnomalyLogs)
router.get('/trace/:noteId', interactionOpsController.getTrace)
router.post('/refresh/:noteId', interactionOpsController.refresh)
router.post('/batch-calibrate', roleMiddleware('admin', 'risk_admin'), interactionOpsController.batchCalibrate)
router.post('/batch-clean-fake', roleMiddleware('admin', 'risk_admin'), interactionOpsController.batchCleanFake)
router.post('/batch-mark-quality', roleMiddleware('admin', 'risk_admin'), interactionOpsController.batchMarkQuality)
router.post('/link-weight/:noteId', interactionOpsController.linkWeight)

export default router
