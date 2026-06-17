import type { Request, Response, NextFunction } from 'express'
import { notePublishService } from '@services/note-publish'
import { success, fail, AppError } from '@utils/response'
import type { AuthenticatedRequest, NotePublishData, NoteScheduleData } from '@/types/index'

export const saveDraft = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await notePublishService.saveDraft(req.user!.userId, req.user!.username, req.body)
    success(res, { id: data.id })
  } catch (error) {
    next(error)
  }
}

export const submitForPublish = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const publishData: NotePublishData = {
      ...req.body,
      ...(req.body as NotePublishData)
    }
    const data = await notePublishService.submitForPublish(req.user!.userId, req.user!.username, publishData)
    success(res, { id: data.id, status: 1 })
  } catch (_err) {
    if (_err instanceof AppError) {
      fail(res, _err.message, _err.code)
      return
    }
    next(_err)
  }
}

export const schedulePublish = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scheduleTime, ...noteData } = req.body
    const scheduleDate = new Date(scheduleTime)
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      fail(res, '预约发布时间必须是有效的未来时间', 400)
      return
    }
    const scheduleData: NoteScheduleData = {
      ...noteData,
      scheduleTime: scheduleDate
    }
    const data = await notePublishService.schedulePublish(req.user!.userId, req.user!.username, scheduleData)
    success(res, { id: data.id, status: 5, scheduleTime: scheduleDate })
  } catch (error) {
    next(error)
  }
}

export const batchPublish = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notes } = req.body
    const data = await notePublishService.batchPublish(req.user!.userId, req.user!.username, notes)
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getBatchPublishLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { level } = req.query
    const limit = notePublishService.getBatchPublishLimit(Number(level))
    success(res, { limit, level: Number(level) })
  } catch (error) {
    next(error)
  }
}

export const executeScheduled = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await notePublishService.executeScheduledPublish()
    success(res, data, '定时发布任务执行完成')
  } catch (error) {
    next(error)
  }
}
