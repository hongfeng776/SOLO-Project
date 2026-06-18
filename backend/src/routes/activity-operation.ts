import { Router } from 'express'
import * as activityOperationController from '@controllers/activity-operation'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/list', activityOperationController.getActivityList)
router.post('/validate-filters', activityOperationController.validateFilterConditions)
router.get('/strategies/list', activityOperationController.getStrategies)
router.put('/strategies/:id', activityOperationController.updateStrategy)
router.post('/batch/execute', activityOperationController.batchExecuteOperation)
router.get('/score-logs/list', activityOperationController.getActivityScoreLogs)
router.get('/abnormal/warning-list', activityOperationController.generateAbnormalWarningList)

router.get('/:id/detail', activityOperationController.getUserActivityDetail)
router.post('/:id/calculate', activityOperationController.calculateActivityScore)
router.post('/:id/refresh', activityOperationController.refreshActivityData)
router.get('/:id/strategies', activityOperationController.getUserStrategies)
router.post('/:id/detect-abnormal', activityOperationController.detectAbnormalActivity)
router.post('/:id/validate', activityOperationController.validateActivityData)

export default router
