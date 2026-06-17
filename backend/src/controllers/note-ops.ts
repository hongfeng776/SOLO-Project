import type { Response, NextFunction } from 'express'
import { noteOpsService } from '@services/note-ops'
import { success, paginate, AppError } from '@utils/response'
import type { AuthenticatedRequest, OperatorRole } from '@/types/index'

const getOperatorRole = (roles: string[]): OperatorRole => {
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('super_ops')) return 'super_ops'
  return 'normal_ops'
}

export const executeOps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId, newStatus, newFlowLevel, newFlowUnlocked, newIsHot, reason } = req.body
    const operatorId = req.user!.userId
    const operatorName = req.user!.username
    const roles = req.user!.roles || []
    const operatorRole = getOperatorRole(roles)

    if (!noteId || newStatus === undefined) {
      throw new AppError('缺少必要参数: noteId 和 newStatus', 400)
    }

    const data = await noteOpsService.executeOps(operatorId, operatorName, operatorRole, {
      noteId: Number(noteId),
      newStatus: Number(newStatus),
      newFlowLevel: newFlowLevel !== undefined ? Number(newFlowLevel) : undefined,
      newFlowUnlocked: newFlowUnlocked !== undefined ? Number(newFlowUnlocked) : undefined,
      newIsHot: newIsHot !== undefined ? Number(newIsHot) : undefined,
      reason
    })

    success(res, data, '运维操作成功')
  } catch (error) {
    next(error)
  }
}

export const batchOps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids, newStatus, newFlowLevel, newFlowUnlocked, reason } = req.body
    const operatorId = req.user!.userId
    const operatorName = req.user!.username
    const roles = req.user!.roles || []
    const operatorRole = getOperatorRole(roles)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('缺少必要参数: ids 必须是非空数组', 400)
    }

    if (newStatus === undefined) {
      throw new AppError('缺少必要参数: newStatus', 400)
    }

    const data = await noteOpsService.batchOps(operatorId, operatorName, operatorRole, {
      ids: ids.map((id: number) => Number(id)),
      newStatus: Number(newStatus),
      newFlowLevel: newFlowLevel !== undefined ? Number(newFlowLevel) : undefined,
      newFlowUnlocked: newFlowUnlocked !== undefined ? Number(newFlowUnlocked) : undefined,
      reason
    })

    success(res, data, '批量运维操作完成')
  } catch (error) {
    next(error)
  }
}

export const validateBeforeOps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { noteId, newStatus } = req.body
    const roles = req.user!.roles || []
    const operatorRole = getOperatorRole(roles)

    if (!noteId || newStatus === undefined) {
      throw new AppError('缺少必要参数: noteId 和 newStatus', 400)
    }

    const data = await noteOpsService.validateBeforeOps(operatorRole, Number(noteId), Number(newStatus))
    success(res, data)
  } catch (error) {
    next(error)
  }
}

export const getNoteHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = Number(req.params.noteId)
    const { page = 1, pageSize = 10 } = req.query
    const data = await noteOpsService.getNoteOpsHistory(
      noteId,
      { page: Number(page), pageSize: Number(pageSize) }
    )
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}

export const getAbnormalOps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const data = await noteOpsService.getAbnormalOpsList({
      page: Number(page),
      pageSize: Number(pageSize)
    })
    paginate(res, data.list, data.total, data.page, data.pageSize)
  } catch (error) {
    next(error)
  }
}
