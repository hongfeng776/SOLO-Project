import { Router } from 'express'
import * as activityStatsController from '@controllers/activity-stats'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

// ==================== 功能点1：数据归集 + 查询 + 筛选冲突校验 ====================
router.post('/snapshot/collect', activityStatsController.collectSnapshot)
router.get('/snapshot/list', activityStatsController.querySnapshots)
router.post('/filter/validate', activityStatsController.validateFilter)

// ==================== 功能点2：数据锁定 + 异常标记 ====================
router.post('/lock', activityStatsController.lockActivityData)
router.post('/anomaly/mark', activityStatsController.manualMarkAnomaly)

// ==================== 功能点3：复盘报表 + 批量导出/对比 ====================
router.post('/report/create', activityStatsController.createReport)
router.get('/report/list', activityStatsController.queryReports)
router.post('/report/status', activityStatsController.updateReportStatus)
router.post('/batch/export', activityStatsController.batchExport)
router.post('/batch/compare', activityStatsController.batchCompare)

// ==================== 功能点4：数据校验 + 溯源轨迹 + 优化结论 ====================
router.post('/validate', activityStatsController.validateData)
router.get('/trace/:activityId', activityStatsController.traceData)
router.post('/optimizations', activityStatsController.getOptimizations)

export default router
