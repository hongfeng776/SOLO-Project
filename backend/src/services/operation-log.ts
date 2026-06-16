import { OperationLog } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

export const operationLogService = {
  async list(params: {
    page: number
    pageSize: number
    module?: string
    action?: string
    userId?: number
    status?: number
    startTime?: string
    endTime?: string
    type?: string
    keyword?: string
  }) {
    const { page, pageSize, module, action, userId, status, startTime, endTime, type, keyword } = params
    const where: any = {}

    if (module) where.module = module
    if (type) where.module = type
    if (action) where.action = { [Op.like]: `%${action}%` }
    if (keyword) where.action = { [Op.like]: `%${keyword}%` }
    if (userId !== undefined) where.userId = userId
    if (status !== undefined) where.status = status
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const log = await OperationLog.findByPk(id)
    if (!log) throw new AppError('日志不存在', 404)
    return log
  },

  async create(data: {
    module: string
    action: string
    method?: string
    params?: string
    result?: string
    ip?: string
    userId?: number
    username?: string
    status?: number
    errorMsg?: string
    costTime?: number
  }) {
    const log = await OperationLog.create(data as any)
    return { id: log.id }
  },

  async remove(id: number) {
    const log = await OperationLog.findByPk(id)
    if (!log) throw new AppError('日志不存在', 404)
    await log.destroy()
    return true
  },

  async batchRemove(ids: number[]) {
    await OperationLog.destroy({ where: { id: { [Op.in]: ids } } })
    return true
  },

  async clean(days?: number) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (days ?? 30))

    await OperationLog.destroy({
      where: { createTime: { [Op.lt]: cutoffDate } }
    })
    return true
  }
}
