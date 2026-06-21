import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '@/types/index'
import { activityService } from '@services/activity'
import { success, paginate } from '@utils/response'

const getOperatorInfo = (req: AuthenticatedRequest) => ({
  userId: req.user!.userId,
  username: req.user!.username,
  roles: req.user!.roles,
  permissions: req.user!.permissions,
  ip: req.ip,
  userAgent: req.headers['user-agent'] as string
})

// ==================== 基础 CRUD ====================
export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      type,
      status,
      scenes,
      participantScopeType,
      homePageDisplay,
      templateId,
      operatorId,
      startTimeFrom,
      startTimeTo
    } = req.query
    const data = await activityService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      type: type as string,
      status: status !== undefined ? Number(status) : undefined,
      scenes: scenes as string,
      participantScopeType: participantScopeType as string,
      homePageDisplay: homePageDisplay !== undefined ? Number(homePageDisplay) : undefined,
      templateId: templateId !== undefined ? Number(templateId) : undefined,
      operatorId: operatorId !== undefined ? Number(operatorId) : undefined,
      startTimeFrom: startTimeFrom as string,
      startTimeTo: startTimeTo as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await activityService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true'
    const data = await activityService.create(req.body, getOperatorInfo(req), { force })
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true'
    const data = await activityService.update(Number(req.params.id), req.body, getOperatorInfo(req), { force })
    success(res, data, '更新成功')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await activityService.remove(Number(req.params.id), getOperatorInfo(req))
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点1：前置校验 ====================
export const validate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.body.id !== undefined ? Number(req.body.id) : undefined
    const data = await activityService.validateActivity({ ...req.body, id }, getOperatorInfo(req))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点2：状态管理 ====================
export const changeStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, remark, force } = req.body
    const forceFlag = force === true || force === '1' || force === 'true'
    const data = await activityService.changeStatus(
      Number(req.params.id),
      Number(status),
      getOperatorInfo(req),
      { force: forceFlag, remark }
    )
    success(res, data, '状态变更成功')
  } catch (error) {
    next(error)
  }
}

export const homePageList = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20 } = _req.query
    const data = await activityService.getHomePageDisplayList({
      page: Number(page),
      pageSize: Number(pageSize)
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const entryInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.query.userId !== undefined ? Number(req.query.userId) : undefined
    const data = await activityService.getCampaignEntryInfo(Number(req.params.id), userId)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点3：批量操作 ====================
export const batchCreate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, templateId, force } = req.body
    const forceFlag = force === true || force === '1' || force === 'true'
    const data = await activityService.batchCreate(
      items as any[],
      getOperatorInfo(req),
      { templateId: templateId ? Number(templateId) : undefined, force: forceFlag }
    )
    success(res, data, `批量创建完成，成功${data.success}个，失败${data.fail}个`)
  } catch (error) {
    next(error)
  }
}

export const batchUpdate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, force } = req.body
    const forceFlag = force === true || force === '1' || force === 'true'
    const data = await activityService.batchUpdate(items as any[], getOperatorInfo(req), { force: forceFlag })
    success(res, data, `批量修改完成，成功${data.success}个，失败${data.fail}个`)
  } catch (error) {
    next(error)
  }
}

export const batchToggle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, force, remark } = req.body
    const forceFlag = force === true || force === '1' || force === 'true'
    const data = await activityService.batchToggle(
      items as any[],
      getOperatorInfo(req),
      { force: forceFlag, remark }
    )
    success(res, data, `批量启停完成，成功${data.success}个，失败${data.fail}个`)
  } catch (error) {
    next(error)
  }
}

export const findOverlapping = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, startTime, endTime, excludeId } = req.query
    const list = await activityService.findOverlappingActivities(
      type as string,
      startTime as string,
      endTime as string,
      excludeId !== undefined ? Number(excludeId) : undefined
    )
    success(res, { list, count: list.length })
  } catch (error) {
    next(error)
  }
}

// ==================== 功能点4：溯源与拦截 ====================
export const auditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 10,
      activityId,
      action,
      operatorId,
      batchId,
      checkLevel,
      startTime,
      endTime
    } = req.query
    const data = await activityService.getAuditLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      activityId: activityId !== undefined ? Number(activityId) : undefined,
      action: action as string,
      operatorId: operatorId !== undefined ? Number(operatorId) : undefined,
      batchId: batchId as string,
      checkLevel: checkLevel as string,
      startTime: startTime as string,
      endTime: endTime as string
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const traceSnapshot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { auditLogId } = req.query
    const data = await activityService.getActivityTraceSnapshot(
      Number(req.params.id),
      auditLogId !== undefined ? Number(auditLogId) : undefined
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const blockadeStats = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await activityService.getBlockadeStats(getOperatorInfo(_req))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

// ==================== 活动模板管理 ====================
export const listTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, type, status } = req.query
    const data = await activityService.listTemplates({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      type: type as string,
      status: status !== undefined ? Number(status) : undefined
    })
    paginate(res, data.list, data.total, Number(page), Number(pageSize))
  } catch (error) {
    next(error)
  }
}

export const createTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await activityService.createTemplate(req.body, getOperatorInfo(req))
    success(res, data, '模板创建成功')
  } catch (error) {
    next(error)
  }
}

export const updateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await activityService.updateTemplate(Number(req.params.id), req.body, getOperatorInfo(req))
    success(res, data, '模板更新成功')
  } catch (error) {
    next(error)
  }
}

export const deleteTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await activityService.deleteTemplate(Number(req.params.id))
    success(res, null, '模板删除成功')
  } catch (error) {
    next(error)
  }
}

export const templateDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await activityService.getTemplateDetail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
