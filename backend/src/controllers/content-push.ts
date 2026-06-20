import { Request, Response } from 'express'
import { success, fail } from '@utils/response'
import * as contentPushService from '@services/content-push'
import { Joi, celebrate } from 'celebrate'

export const list = async (req: Request, res: Response) => {
  try {
    const result = await contentPushService.list(req.query)
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
}

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await contentPushService.detail(Number(id))
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
}

export const validateCreate = async (req: Request, res: Response) => {
  try {
    const roles = (req as any).user?.roles || []
    const result = await contentPushService.validateCreateData(req.body, roles)
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '校验失败')
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.create(req.body, roles, operator)
    return success(res, result, result.success ? '创建成功' : result.reason || '创建被拦截')
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
}

export const startPush = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.startPush(Number(id), roles, operator)
    return success(res, result, '已启动推送')
  } catch (e: any) {
    if (e.message === '403') return fail(res, '您没有启动推送的权限', 403)
    return fail(res, e.message || '操作失败')
  }
}

export const pausePush = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.pausePush(Number(id), roles, operator)
    return success(res, result, '已暂停推送')
  } catch (e: any) {
    if (e.message === '403') return fail(res, '您没有暂停推送的权限', 403)
    return fail(res, e.message || '操作失败')
  }
}

export const terminatePush = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.terminatePush(Number(id), roles, operator, req.body?.reason)
    return success(res, result, '已终止推送')
  } catch (e: any) {
    if (e.message === '403') return fail(res, '您没有终止推送的权限（需高级运维或管理员）', 403)
    return fail(res, e.message || '操作失败')
  }
}

export const adjustStrength = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { strength } = req.body
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.adjustStrength(Number(id), Number(strength), roles, operator)
    return success(res, result, '推送力度已调整')
  } catch (e: any) {
    if (e.message === '403') return fail(res, '您没有调整推送力度的权限', 403)
    return fail(res, e.message || '操作失败')
  }
}

export const batchOperation = async (req: Request, res: Response) => {
  try {
    const roles = (req as any).user?.roles || []
    const operator = (req as any).user
    const result = await contentPushService.batchOperation(req.body, roles, operator)
    return success(res, result, `批量操作完成：成功${result.success}，失败${result.fail}`)
  } catch (e: any) {
    if (e.message === '403') return fail(res, '您没有批量操作的权限', 403)
    return fail(res, e.message || '批量操作失败')
  }
}

export const refreshStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await contentPushService.refreshStats(Number(id))
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '刷新失败')
  }
}

export const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await contentPushService.getPushStats()
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '统计查询失败')
  }
}

export const listTraces = async (req: Request, res: Response) => {
  try {
    const result = await contentPushService.listTraces(req.query)
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
}

export const getFullChain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await contentPushService.getFullChain(Number(id))
    return success(res, result)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
}

export const createValidation = celebrate({
  body: Joi.object({
    noteId: Joi.number().required().positive().messages({
      'any.required': '请选择要推送的笔记',
      'number.positive': '笔记ID无效'
    }),
    poolId: Joi.number().required().positive().messages({
      'any.required': '请选择目标流量池',
      'number.positive': '流量池ID无效'
    }),
    pushStrength: Joi.number().valid(1, 2, 3).optional().messages({
      'any.only': '推送力度仅支持1/2/3'
    }),
    expectedEndTime: Joi.date().optional()
  })
})

export const batchValidation = celebrate({
  body: Joi.object({
    operation: Joi.string().valid('start', 'pause', 'terminate', 'strengthen', 'downgrade', 'enhance').required().messages({
      'any.required': '请指定批量操作类型',
      'any.only': '不支持的批量操作类型'
    }),
    ids: Joi.array().items(Joi.number().positive()).optional(),
    filter: Joi.object().optional(),
    reason: Joi.string().optional(),
    targetStrength: Joi.number().valid(1, 2, 3).optional()
  })
})
