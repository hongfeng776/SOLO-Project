import type { Request, Response, NextFunction } from 'express'
import { trafficPoolService } from '@services/traffic-pool'
import { success, paginate } from '@utils/response'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, poolLevel, contentAdaptType, status } = req.query
    const user = (req as any).user
    const data = await trafficPoolService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword: keyword as string,
      poolLevel: poolLevel !== undefined ? Number(poolLevel) : undefined,
      contentAdaptType: contentAdaptType as string,
      status: status !== undefined ? Number(status) : undefined,
      roles: user?.roles || []
    })
    paginate(res, data.list as any[], data.total, data.page, data.pageSize, { permission: data.permission } as any)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.detail(Number(req.params.id), user?.roles || [])
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validateCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { poolLevel, contentAdaptType, dailyQuota, minContentScore, maxViolationCount } = req.body
    const data = await trafficPoolService.validateCreateData({
      poolLevel: Number(poolLevel),
      contentAdaptType,
      dailyQuota: Number(dailyQuota),
      minContentScore: Number(minContentScore),
      maxViolationCount: Number(maxViolationCount)
    })
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.create({
      ...req.body,
      operatorId: user?.id,
      operatorName: user?.nickname || user?.username,
      operatorRole: user?.roles?.[0] || '',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      roles: user?.roles || []
    })
    success(res, data, '创建成功')
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.update(Number(req.params.id), {
      ...req.body,
      operatorId: user?.id,
      operatorName: user?.nickname || user?.username,
      operatorRole: user?.roles?.[0] || '',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      roles: user?.roles || []
    })
    success(res, data, '更新成功，配置已即时生效')
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    await trafficPoolService.remove(Number(req.params.id), user?.roles || [])
    success(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}

export const batchUpdateQuota = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.batchUpdateQuota({
      ...req.body,
      operatorId: user?.id,
      operatorName: user?.nickname || user?.username,
      operatorRole: user?.roles?.[0] || '',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      roles: user?.roles || []
    })
    success(res, data, `批量配额调整完成：成功${data.success}条，失败${data.fail}条`)
  } catch (error) {
    next(error)
  }
}

export const batchUpdateRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.batchUpdateRules({
      ...req.body,
      operatorId: user?.id,
      operatorName: user?.nickname || user?.username,
      operatorRole: user?.roles?.[0] || '',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      roles: user?.roles || []
    })
    success(res, data, `批量规则调整完成：成功${data.success}条，失败${data.fail}条`)
  } catch (error) {
    next(error)
  }
}

export const batchToggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.batchToggleStatus({
      ...req.body,
      operatorId: user?.id,
      operatorName: user?.nickname || user?.username,
      operatorRole: user?.roles?.[0] || '',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      roles: user?.roles || []
    })
    success(res, data, `批量启停完成：成功${data.success}条，失败${data.fail}条`)
  } catch (error) {
    next(error)
  }
}

export const getQuotaStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await trafficPoolService.getQuotaStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const listLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, poolId, logType, status, keyword, startDate, endDate } = req.query
    const user = (req as any).user
    const data = await trafficPoolService.listLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      poolId: poolId !== undefined ? Number(poolId) : undefined,
      logType: logType as string,
      status: status !== undefined ? Number(status) : undefined,
      keyword: keyword as string,
      startDate: startDate as string,
      endDate: endDate as string,
      roles: user?.roles || []
    })
    paginate(res, data.list as any[], data.total, data.page, data.pageSize, { permission: data.permission } as any)
  } catch (error) {
    next(error)
  }
}

export const analyzeLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user
    const data = await trafficPoolService.analyzeLog(Number(req.params.id), user?.roles || [])
    success(res, data)
  } catch (error) {
    next(error)
  }
}
