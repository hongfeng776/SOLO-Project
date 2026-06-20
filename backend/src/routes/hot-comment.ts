import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'
import * as hotCommentController from '@controllers/hot-comment'

const router = Router()

router.use(authMiddleware)

router.get('/', hotCommentController.list)
router.get('/stats', hotCommentController.getStats)
router.get('/logs', hotCommentController.getLogs)
router.get('/trace/:commentId', hotCommentController.getTrace)
router.get('/anomaly-detect', hotCommentController.anomalyDetect)
router.post('/compute', hotCommentController.computeAndRank)
router.post('/refresh-ranking', roleMiddleware('admin', 'risk_admin'), hotCommentController.refreshRanking)
router.post('/manual-top', roleMiddleware('admin', 'risk_admin'), hotCommentController.manualTop)
router.post('/cancel-top', roleMiddleware('admin', 'risk_admin'), hotCommentController.cancelTop)
router.post('/batch-top', roleMiddleware('admin', 'risk_admin'), hotCommentController.batchTop)
router.post('/batch-off', roleMiddleware('admin', 'risk_admin'), hotCommentController.batchOff)

export default router
