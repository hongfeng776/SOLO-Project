import type { Request, Response, NextFunction } from 'express'
import { celebrate, Joi } from 'celebrate'
import { success, paginate } from '@utils/response'
import * as weightRuleService from '@services/traffic-weight-rule'

export interface WeightRulePermission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canToggle: boolean
  canBatch: boolean
  canAdjust: boolean
  canViewTrace: boolean
  canRecalc: boolean
}

const getCurrentUser = (req: Request) => ({
  id: (req as any).user?.id,
  nickname: (req as any).user?.nickname,
  username: (req as any).user?.username,
  roles: (req as any).user?.roles || []
})

export const getPermission = (roles: string[]): WeightRulePermission => {
  return weightRuleService.getWeightRulePermission(roles)
}

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canView) { res.status(403).json({ code: 403, message: '无权查看权重规则' }); return }
    const data = await weightRuleService.listWeightRules({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      keyword: req.query.keyword as string,
      sceneType: req.query.sceneType as string,
      status: req.query.status !== undefined ? Number(req.query.status) : undefined,
      ruleCode: req.query.ruleCode as string
    })
    paginate(res, data.list as any[], data.total, data.page, data.pageSize, { permission: perm } as any)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canView) { res.status(403).json({ code: 403, message: '无权查看' }); return }
    const data = await weightRuleService.getWeightRuleDetail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const validateCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canCreate) { res.status(403).json({ code: 403, message: '无权创建' }); return }
    const data = await weightRuleService.validateCreateData(req.body)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const createValidation = celebrate({
  body: Joi.object({
    ruleName: Joi.string().required().max(100),
    sceneType: Joi.string().valid('daily', 'activity').required(),
    contentQualityWeight: Joi.number().integer().min(0).max(100),
    userActivityWeight: Joi.number().integer().min(0).max(100),
    interactionWeight: Joi.number().integer().min(0).max(100),
    complianceWeight: Joi.number().integer().min(0).max(100)
  })
})

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.createWeightRule(req.body, user.roles, user)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.updateWeightRule(Number(req.params.id), req.body, user.roles, user)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const enable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.toggleWeightRule(Number(req.params.id), true, user.roles, user, req.body?.reason)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const disable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.toggleWeightRule(Number(req.params.id), false, user.roles, user, req.body?.reason)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const adjust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.adjustWeights(Number(req.params.id), req.body, user.roles, user)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const batchValidation = celebrate({
  body: Joi.object({
    operation: Joi.string().valid('enable', 'disable', 'adjust', 'delete').required(),
    ids: Joi.array().items(Joi.number()).optional(),
    filter: Joi.object().optional(),
    targetWeights: Joi.object().optional(),
    reason: Joi.string().max(500).optional()
  })
})

export const batchOperation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.batchOperation(req.body, user.roles, user)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作，批量操作仅超级运营权限可执行' }); return }
    next(error)
  }
}

export const recalc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await weightRuleService.recalcQueue(Number(req.params.id), user.roles, user)
    success(res, data)
  } catch (error: any) {
    if (error.message === '403') { res.status(403).json({ code: 403, message: '无权操作' }); return }
    next(error)
  }
}

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canView) { res.status(403).json({ code: 403, message: '无权查看' }); return }
    const data = await weightRuleService.getWeightRuleStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const listLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canViewTrace) { res.status(403).json({ code: 403, message: '无权查看溯源日志' }); return }
    const data = await weightRuleService.listRuleLogs({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      ruleId: req.query.ruleId,
      logType: req.query.logType as string,
      status: req.query.status,
      blockReason: req.query.blockReason as string,
      operatorId: req.query.operatorId,
      keyword: req.query.keyword as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    })
    paginate(res, data.list as any[], data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const getImpactAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const perm = getPermission(user.roles)
    if (!perm.canViewTrace) { res.status(403).json({ code: 403, message: '无权查看' }); return }
    const data = await weightRuleService.getRuleImpactAnalysis(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}
