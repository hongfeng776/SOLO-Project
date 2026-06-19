import type { Request, Response, NextFunction } from 'express'
import { interactionOpsService } from '@services/interaction-ops'
import { success, fail } from '@utils/response'
import type { AuthenticatedRequest } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, noteId, dataType, isAnomaly, status, isQuality, flowLevel } = req.query
    const data = await interactionOpsService.list({
      page: Number(page), pageSize: Number(pageSize),
      noteId: noteId ? Number(noteId) : undefined,
      dataType: dataType as string,
      isAnomaly: isAnomaly !== undefined ? Number(isAnomaly) : undefined,
      status: status !== undefined ? Number(status) : undefined,
      isQuality: isQuality !== undefined ? Number(isQuality) : undefined,
      flowLevel: flowLevel !== undefined ? Number(flowLevel) : undefined
    })
    success(res, data)
  } catch (error) { next(error) }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await interactionOpsService.getStats()
    success(res, data)
  } catch (error) { next(error) }
}

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId } = req.params
    const data = await interactionOpsService.refreshInteractionData(Number(noteId))
    success(res, data)
  } catch (error) { next(error) }
}

export const batchCalibrate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const handlerId = req.user?.userId || 0
    const handlerName = req.user?.username || 'system'
    const data = await interactionOpsService.batchCalibrate(ids, handlerId, handlerName)
    success(res, data)
  } catch (error) { next(error) }
}

export const batchCleanFake = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const handlerId = req.user?.userId || 0
    const handlerName = req.user?.username || 'system'
    const data = await interactionOpsService.batchCleanFake(ids, handlerId, handlerName)
    success(res, data)
  } catch (error) { next(error) }
}

export const batchMarkQuality = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body
    const handlerId = req.user?.userId || 0
    const handlerName = req.user?.username || 'system'
    const data = await interactionOpsService.batchMarkQuality(ids, handlerId, handlerName)
    success(res, data)
  } catch (error) { next(error) }
}

export const linkWeight = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId } = req.params
    const handlerId = req.user?.userId || 0
    const handlerName = req.user?.username || 'system'
    const data = await interactionOpsService.linkWeight(Number(noteId), handlerId, handlerName)
    success(res, data)
  } catch (error) { next(error) }
}

export const getTrace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId } = req.params
    const data = await interactionOpsService.getTrace(Number(noteId))
    success(res, data)
  } catch (error) { next(error) }
}

export const getAnomalyLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, noteId, action } = req.query
    const data = await interactionOpsService.getAnomalyLogs({
      page: Number(page), pageSize: Number(pageSize),
      noteId: noteId ? Number(noteId) : undefined,
      action: action !== undefined ? Number(action) : undefined
    })
    success(res, data)
  } catch (error) { next(error) }
}
