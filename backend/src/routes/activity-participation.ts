import { Router } from 'express'
import * as participationController from '@controllers/activity-participation'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

// ==================== 用户活动中心：我的参与 ====================
router.get('/my/list', participationController.myList)

// ==================== 功能点1：前置校验 & 报名 ====================
router.get('/validate', participationController.validateEligibility)
router.post('/sign-up', participationController.signUp)

// ==================== 功能点2：任务提交 & 状态变更 ====================
router.post('/:id/task', participationController.submitTask)
router.put('/:id/status', participationController.changeStatus)

// ==================== 功能点3：批量操作 ====================
router.post('/batch/approve', participationController.batchApprove)
router.post('/batch/reject', participationController.batchReject)
router.post('/batch/remove', participationController.batchRemove)
router.post('/batch/reset', participationController.batchReset)

// ==================== 基础 CRUD ====================
router.get('/list', participationController.list)
router.get('/list/:id', participationController.detail)

// ==================== 功能点4：审计溯源 & 拦截统计 ====================
router.get('/audit/logs', participationController.auditLogs)
router.get('/:id/trace', participationController.traceSnapshot)
router.post('/clear-invalid', participationController.clearInvalid)
router.get('/anomaly/stats', participationController.anomalyStats)

export default router
