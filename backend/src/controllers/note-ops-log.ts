import type { Request, Response, NextFunction } from 'express'
import { noteOpsLogService } from '@services/note-ops-log'
import { success, paginate } from '@utils/response'
import type { OperatorRole } from '@/types/index'

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, noteId, operatorId, operatorRole, startTime, endTime } = req.query
    const data = await noteOpsLogService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      noteId: noteId !== undefined ? Number(noteId) : undefined,
      operatorId: operatorId !== undefined ? Number(operatorId) : undefined,
      operatorRole: operatorRole as OperatorRole | undefined,
      startTime: startTime as string,
      endTime: endTime as string
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteOpsLogService.detail(Number(req.params.id))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await noteOpsLogService.getStats()
    success(res, data)
  } catch (error) {
    next(error)
  }
}
