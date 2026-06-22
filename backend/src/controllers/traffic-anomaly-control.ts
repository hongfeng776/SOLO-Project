import type { Request, Response, NextFunction } from 'express'
import { celebrate, Joi } from 'celebrate'
import { success, paginate } from '@utils/response'
import * as anomalyService from '@services/traffic-anomaly-control'
import type { TrafficAnomalyBlockReason } from '@models/traffic-anomaly-handle-log'
import { TrafficAnomalyHandleType } from '@models/traffic-anomaly-handle-log'
import { TrafficAnomalyType, TrafficAnomalyRiskLevel, TrafficAnomalySource } from '@models/traffic-anomaly-record'

const getCurrentUser = (req: Request) => ({
  userId: (req as any).user?.id,
  nickname: (req as any).user?.nickname,
  username: (req as any).user?.username,
  roles: (req as any).user?.roles || [],
  permissions: (req as any).user?.permissions || [],
  ip: (req as any).ip,
  userAgent: req.get('User-Agent')
})

export const detectValidation = celebrate({
  body: Joi.object({
    exposureCount: Joi.number().integer().min(0),
    exposureFrequency: Joi.number().integer().min(0),
    uniqueIpCount: Joi.number().integer().min(0),
    uniqueDeviceCount: Joi.number().integer().min(0),
    uniqueUserCount: Joi.number().integer().min(0),
    ipAddress: Joi.string().max(50),
    userSource: Joi.string().max(50),
    timeWindowMs: Joi.number().integer().min(0),
    frequencyData: Joi.object().pattern(Joi.string(), Joi.number())
  })
})

export const handleValidation = celebrate({
  body: Joi.object({
    handleType: Joi.string()
      .valid(...Object.values(TrafficAnomalyHandleType))
      .required(),
    reason: Joi.string().max(500).required()
  })
})

export const batchValidation = celebrate({
  body: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()),
    anomalyType: Joi.string().valid(...Object.values(TrafficAnomalyType)),
    riskLevel: Joi.number().integer().valid(...Object.values(TrafficAnomalyRiskLevel).filter(v => typeof v === 'number')),
    handleType: Joi.string()
      .valid(...Object.values(TrafficAnomalyHandleType))
      .required(),
    reason: Joi.string().max(500).required()
  }).or('ids', 'anomalyType', 'riskLevel')
})

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.getTrafficAnomalyStats(user.roles)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.listTrafficAnomalies({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      keyword: req.query.keyword as string,
      anomalyType: req.query.anomalyType as TrafficAnomalyType,
      riskLevel: req.query.riskLevel !== undefined ? Number(req.query.riskLevel) : undefined,
      status: req.query.status !== undefined ? Number(req.query.status) : undefined,
      source: req.query.source as TrafficAnomalySource,
      startTime: req.query.startTime as string,
      endTime: req.query.endTime as string
    }, user.roles)
    paginate(res, data.list as unknown as Record<string, unknown>[], data.total, Number(req.query.page) || 1, Number(req.query.pageSize) || 20, { permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.getTrafficAnomalyDetail(Number(req.params.id), user.roles)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const detect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = anomalyService.detectAnomaly(req.body)
    success(res, result)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.createTrafficAnomaly(req.body, user)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.handleTrafficAnomaly(
      Number(req.params.id),
      req.body.handleType,
      req.body.reason,
      user
    )
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const batchHandle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.batchHandleTrafficAnomalies(req.body, user)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const listLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.listHandleLogs({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      keyword: req.query.keyword as string,
      handleType: req.query.handleType as TrafficAnomalyHandleType,
      handleStatus: req.query.handleStatus !== undefined ? Number(req.query.handleStatus) : undefined,
      blockReason: req.query.blockReason as TrafficAnomalyBlockReason,
      startTime: req.query.startTime as string,
      endTime: req.query.endTime as string
    }, user.roles)
    paginate(res, data.list as unknown as Record<string, unknown>[], data.total, Number(req.query.page) || 1, Number(req.query.pageSize) || 20, { permission: data.permission })
  } catch (error) {
    next(error)
  }
}

export const impactAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = getCurrentUser(req)
    const data = await anomalyService.getAnomalyImpactAnalysis(Number(req.params.id), user.roles)
    success(res, data)
  } catch (error) {
    next(error)
  }
}
