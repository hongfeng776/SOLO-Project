import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '@/types/index'
import statsService from '@services/activity-stats'
import { success, paginate } from '@utils/response'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions,
  ip: req.ip,
  userAgent: req.headers['user-agent'] as string
})

// ==================== 功能点1：数据归集 + 查询 + 筛选冲突校验 ====================

export const collectSnapshot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, timeDimension, startTime, endTime, dimensionType, batchId } = req.body
    const data = await statsService.collectSnapshot({
      activityId: Number(activityId),
      timeDimension,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      dimensionType,
      batchId
    }, getOperatorInfo(req))
    success(res, data, '数据归集完成')
  } catch (error) {
    next(error)
  }
}

export const querySnapshots = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      activityId, activityIds, timeDimension, startTime, endTime,
      dimensionType, dimensionValue, anomalyLevel, isLocked,
      page = 1, pageSize = 20, sortField = 'createTime', sortOrder = 'desc'
    } = req.query
    const data = await statsService.querySnapshots({
      activityId: activityId ? Number(activityId) : undefined,
      activityIds: activityIds ? (activityIds as string).split(',').map(Number) : undefined,
      timeDimension: timeDimension as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      dimensionType: dimensionType as string,
      dimensionValue: dimensionValue as string,
      anomalyLevel: anomalyLevel !== undefined ? Number(anomalyLevel) : undefined,
      isLocked: isLocked !== undefined ? Number(isLocked) : undefined,
      page: Number(page),
      pageSize: Number(pageSize),
      sortField: sortField as string,
      sortOrder: sortOrder as string
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const validateFilter = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conditions = req.body || {}
    const conflicts = statsService.validateFilter(conditions)
    success(res, {
      valid: conflicts.length === 0,
      conflicts,
      count: conflicts.length,
      message: conflicts.length > 0 ? `检测到${conflicts.length}个筛选条件冲突` : '筛选条件有效'
    })
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：状态联动 + 锁定 + 异常标记 ====================

export const lockActivityData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId } = req.body
    const data = await statsService.lockActivityData(Number(activityId), getOperatorInfo(req))
    success(res, data, `活动数据锁定完成，锁定 ${data.lockedSnapshots} 条快照`)
  } catch (error) {
    next(error)
  }
}

export const manualMarkAnomaly = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { snapshotId, anomalyType, remark } = req.body
    const data = await statsService.manualMarkAnomaly(Number(snapshotId), anomalyType, remark || '', getOperatorInfo(req))
    success(res, data, '异常维度标记完成')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点3：复盘报表 + 批量导出/对比 + 状态变更 ====================

export const createReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      activityId, activityIds, reportType, reportName, customFields,
      sortRule, filterConditions, startTime, endTime, batchId, remark
    } = req.body
    const data = await statsService.createReport({
      activityId: activityId ? Number(activityId) : undefined,
      activityIds: activityIds ? activityIds.map(Number) : undefined,
      reportType,
      reportName,
      customFields,
      sortRule,
      filterConditions,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      operator: getOperatorInfo(req),
      batchId,
      remark
    })
    success(res, data, '复盘报表生成成功')
  } catch (error) {
    next(error)
  }
}

export const queryReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId, status, reportType, page = 1, pageSize = 20, sortField = 'createTime', sortOrder = 'desc' } = req.query
    const data = await statsService.queryReports({
      activityId: activityId ? Number(activityId) : undefined,
      status: status !== undefined ? Number(status) : undefined,
      reportType: reportType as string,
      page: Number(page),
      pageSize: Number(pageSize),
      sortField: sortField as string,
      sortOrder: sortOrder as string
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const updateReportStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reportId, action } = req.body
    const data = await statsService.updateReportStatus(Number(reportId), action, getOperatorInfo(req))
    success(res, data, `报表状态更新：${data.statusName}`)
  } catch (error) {
    next(error)
  }
}

export const batchExport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityIds, startTime, endTime, dimensionType, customFields, filterConditions } = req.body
    const data = await statsService.batchExport({
      activityIds: activityIds ? activityIds.map(Number) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      dimensionType,
      customFields,
      filterConditions,
      operator: getOperatorInfo(req)
    })
    success(res, data, `批量导出任务创建成功，共 ${data.totalRows} 条数据`)
  } catch (error) {
    next(error)
  }
}

export const batchCompare = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityIds, compareMetrics, customFields } = req.body
    const data = await statsService.batchCompare({
      activityIds: (activityIds as number[]).map(Number),
      compareMetrics,
      customFields,
      operator: getOperatorInfo(req)
    })
    success(res, data, `批量对比完成，共 ${activityIds.length} 个活动`)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：数据校验 + 溯源轨迹 + 优化结论 ====================

export const validateData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityIds, startTime, endTime } = req.body
    const data = await statsService.validateData({
      activityIds: activityIds ? activityIds.map(Number) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined
    })
    const passCount = data.filter(v => v.pass).length
    success(res, {
      validations: data,
      summary: {
        total: data.length,
        pass: passCount,
        warning: data.filter(v => v.level === 'warning').length,
        error: data.filter(v => v.level === 'error').length,
        rate: data.length > 0 ? ((passCount / data.length) * 100).toFixed(1) + '%' : 'N/A'
      }
    }, data.length === 0 ? '无数据可校验' : '数据校验完成')
  } catch (error) {
    next(error)
  }
}

export const traceData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityId } = req.params
    const { targetType, startTime, endTime, page = 1, pageSize = 20 } = req.query
    const data = await statsService.traceData(Number(activityId), {
      targetType: targetType as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      page: Number(page),
      pageSize: Number(pageSize)
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const getOptimizations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activityIds, startTime, endTime } = req.body
    const validations = await statsService.validateData({
      activityIds: activityIds ? activityIds.map(Number) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined
    })

    const { list: snaps } = await statsService.querySnapshots({
      activityIds: activityIds ? activityIds.map(Number) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      pageSize: 1000
    })
    const snapList = snaps as any[]
    const exposure = snapList.reduce((s, r) => s + Number(r.exposureCount || 0), 0)
    const participate = snapList.reduce((s, r) => s + Number(r.participateCount || 0), 0)
    const reward = snapList.reduce((s, r) => s + Number(r.rewardIssueAmount || 0), 0)
    const conversion = exposure > 0 ? participate / exposure : 0
    const retention = snapList.length ? snapList.reduce((s, r) => s + Number(r.retentionD1 || 0), 0) / snapList.length : 0

    const optimizations = statsService.generateOptimizations({
      exposure, participate, conversion, retention, reward, validations
    })

    success(res, {
      metricsSummary: { exposure, participate, conversion, retention, reward },
      validations,
      optimizations,
      priorityStats: {
        critical: optimizations.filter(o => o.priority === 'critical').length,
        high: optimizations.filter(o => o.priority === 'high').length,
        medium: optimizations.filter(o => o.priority === 'medium').length,
        low: optimizations.filter(o => o.priority === 'low').length
      }
    })
  } catch (error) {
    next(error)
  }
}

export default {
  collectSnapshot, querySnapshots, validateFilter,
  lockActivityData, manualMarkAnomaly,
  createReport, queryReports, updateReportStatus,
  batchExport, batchCompare,
  validateData, traceData, getOptimizations
}
