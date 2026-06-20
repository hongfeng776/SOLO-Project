import { Router } from 'express'
import * as trafficPoolController from '@controllers/traffic-pool'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)
router.use(roleMiddleware('admin', 'operation_admin', 'senior_operator', 'operator'))

router.get('/', trafficPoolController.list)
router.post('/validate', trafficPoolController.validateCreate)
router.post('/', trafficPoolController.create)
router.get('/quota-stats', trafficPoolController.getQuotaStats)
router.get('/logs', trafficPoolController.listLogs)
router.get('/logs/:id/analyze', trafficPoolController.analyzeLog)
router.get('/:id', trafficPoolController.detail)
router.put('/:id', trafficPoolController.update)
router.delete('/:id', trafficPoolController.remove)
router.post('/batch/quota', trafficPoolController.batchUpdateQuota)
router.post('/batch/rules', trafficPoolController.batchUpdateRules)
router.post('/batch/status', trafficPoolController.batchToggleStatus)

export default router
