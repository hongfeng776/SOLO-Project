import { Router } from 'express'
import * as rewardController from '@controllers/activity-reward'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

// ==================== 用户侧：我的奖励 ====================
router.get('/my/list', rewardController.myRewards)

// ==================== 功能点1：前置校验 ====================
router.get('/validate', rewardController.validateIssue)

// ==================== 功能点2：发放状态联动 ====================
router.post('/pending', rewardController.createPending)
router.post('/:id/lock', rewardController.lockBudget)
router.post('/:id/issue', rewardController.issueReward)
router.post('/:id/arrive', rewardController.confirmArrival)
router.post('/:id/reissue', rewardController.reissueReward)
router.post('/:id/recycle', rewardController.recycleReward)

// ==================== 功能点3：批量操作 ====================
router.post('/batch/issue', rewardController.batchIssue)
router.post('/batch/reissue', rewardController.batchReissue)
router.post('/batch/recycle', rewardController.batchRecycle)
router.post('/batch/differential', rewardController.batchIssueDifferential)

// ==================== 基础 CRUD ====================
router.get('/list', rewardController.list)
router.get('/list/:id', rewardController.detail)

// ==================== 功能点4：审计溯源 + 账目核对 ====================
router.get('/audit/logs', rewardController.auditLogs)
router.get('/:id/trace', rewardController.traceSnapshot)
router.post('/reconcile', rewardController.reconcileAccount)
router.get('/reconcile/stats', rewardController.reconcileStats)

export default router
