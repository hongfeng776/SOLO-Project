import { NoteOpsLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import type { NoteOpsLogListParams, NoteOpsStats, NoteAbnormalOpsListParams } from '@/types/index'

export const noteOpsLogService = {
  async list(params: NoteOpsLogListParams) {
    const { page, pageSize, noteId, operatorId, operatorRole, startTime, endTime } = params
    const where: any = {}

    if (noteId !== undefined) where.noteId = noteId
    if (operatorId !== undefined) where.operatorId = operatorId
    if (operatorRole !== undefined) where.operatorRole = operatorRole
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }

    const { count, rows } = await NoteOpsLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const log = await NoteOpsLog.findByPk(id)
    if (!log) throw new AppError('操作日志不存在', 404)
    return log
  },

  async create(data: {
    noteId: number
    noteTitle: string
    operatorId: number
    operatorName: string
    operatorRole: string
    previousStatus: number
    newStatus: number
    previousFlowLevel?: number
    newFlowLevel?: number
    previousFlowUnlocked?: number
    newFlowUnlocked?: number
    previousIsHot?: number
    newIsHot?: number
    reason?: string
    isAbnormal?: number
    abnormalReason?: string
  }) {
    const log = await NoteOpsLog.create({
      ...data,
      isAbnormal: data.isAbnormal || 0,
      abnormalReason: data.abnormalReason || ''
    } as any)
    return { id: log.id }
  },

  async getNoteOpsHistory(noteId: number, page: number = 1, pageSize: number = 10) {
    const { count, rows } = await NoteOpsLog.findAndCountAll({
      where: { noteId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'ASC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getAbnormalOpsList(params: NoteAbnormalOpsListParams) {
    const { page, pageSize } = params

    const { count, rows } = await NoteOpsLog.findAndCountAll({
      where: { isAbnormal: 1 },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async getStats(): Promise<NoteOpsStats> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const totalToday = await NoteOpsLog.count({
      where: {
        createTime: { [Op.gte]: startOfDay }
      }
    })

    const abnormalCount = await NoteOpsLog.count({
      where: {
        isAbnormal: 1
      }
    })

    const logs = await NoteOpsLog.findAll({
      where: {
        createTime: { [Op.gte]: startOfDay }
      },
      attributes: ['operatorId', 'operatorName']
    })

    const operatorMap = new Map<string, { operatorId: number; operatorName: string; count: number }>()
    for (const log of logs) {
      const key = String(log.operatorId)
      if (operatorMap.has(key)) {
        operatorMap.get(key)!.count++
      } else {
        operatorMap.set(key, {
          operatorId: log.operatorId,
          operatorName: log.operatorName,
          count: 1
        })
      }
    }

    const byOperator = Array.from(operatorMap.values()).sort((a, b) => b.count - a.count)

    return {
      totalToday,
      abnormalCount,
      byOperator
    }
  }
}
