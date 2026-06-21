import { Router } from 'express'
import * as activityController from '@controllers/activity'
import * as orderController from '@controllers/order'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

// ==================== 活动基础 CRUD ====================
router.get('/list', activityController.list)
router.get('/list/:id', activityController.detail)
router.post('/list', activityController.create)
router.put('/list/:id', activityController.update)
router.delete('/list/:id', activityController.remove)

// ==================== 功能点1：前置校验 ====================
router.post('/validate', activityController.validate)
router.get('/overlapping', activityController.findOverlapping)

// ==================== 功能点2：状态管理 & 入口联动 ====================
router.put('/:id/status', activityController.changeStatus)
router.get('/home-page/list', activityController.homePageList)
router.get('/:id/entry-info', activityController.entryInfo)

// ==================== 功能点3：批量操作 ====================
router.post('/batch/create', activityController.batchCreate)
router.post('/batch/update', activityController.batchUpdate)
router.post('/batch/toggle', activityController.batchToggle)

// ==================== 功能点4：溯源 & 拦截统计 ====================
router.get('/audit/logs', activityController.auditLogs)
router.get('/:id/trace', activityController.traceSnapshot)
router.get('/blockade/stats', activityController.blockadeStats)

// ==================== 活动模板管理 ====================
router.get('/templates/list', activityController.listTemplates)
router.get('/templates/:id', activityController.templateDetail)
router.post('/templates/list', activityController.createTemplate)
router.put('/templates/:id', activityController.updateTemplate)
router.delete('/templates/:id', activityController.deleteTemplate)

// ==================== 订单路由（保留原有） ====================
router.get('/orders', orderController.list)
router.get('/orders/stats', orderController.getStats)
router.get('/orders/:id', orderController.detail)
router.post('/orders', orderController.create)
router.put('/orders/:id', orderController.update)
router.put('/orders/:id/status', orderController.updateStatus)
router.post('/orders/batch-update-status', orderController.batchUpdateStatus)
router.delete('/orders/:id', orderController.remove)

export default router
