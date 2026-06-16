import { Settlement } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { notificationService } from './notification'

export const settlementService = {
  async list(params: {
    page: number
    pageSize: number
    creatorId?: number
    status?: number
    settlementPeriod?: string
    type?: string
    keyword?: string
    startTime?: string
    endTime?: string
  }) {
    const { page, pageSize, creatorId, status, settlementPeriod, type, keyword, startTime, endTime } = params
    const where: any = {}

    if (creatorId !== undefined) where.creatorId = creatorId
    if (status !== undefined) where.status = status
    if (settlementPeriod) where.settlementPeriod = settlementPeriod
    if (type) where.type = type
    if (keyword) {
      where[Op.or] = [
        { settlementNo: { [Op.like]: `%${keyword}%` } },
        { creatorName: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: startTime }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: endTime }

    const { count, rows } = await Settlement.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const settlement = await Settlement.findByPk(id)
    if (!settlement) throw new AppError('结算记录不存在', 404)
    return settlement
  },

  async create(data: {
    settlementNo: string
    creatorId: number
    creatorName: string
    type?: string
    amount: number
    settlementPeriod: string
    orderIds?: string
    remark?: string
  }) {
    const existing = await Settlement.findOne({ where: { settlementNo: data.settlementNo } })
    if (existing) throw new AppError('结算单号已存在', 400)

    const settlement = await Settlement.create({ ...data, status: 0 } as any)
    return { id: settlement.id }
  },

  async settle(id: number) {
    const settlement = await Settlement.findByPk(id)
    if (!settlement) throw new AppError('结算记录不存在', 404)
    if (settlement.status !== 0) {
      throw new AppError('只有待结算的记录才能执行结算', 400)
    }

    await settlement.update({
      status: 1,
      settleTime: new Date()
    })

    await notificationService.create({
      userId: settlement.creatorId,
      type: 'settlement',
      title: '结算完成通知',
      content: `您的结算单${settlement.settlementNo}已完成结算，金额：${settlement.amount}元`,
      relatedId: settlement.id,
      relatedType: 'settlement'
    })

    return { id: settlement.id }
  },

  async reject(id: number, reason: string) {
    const settlement = await Settlement.findByPk(id)
    if (!settlement) throw new AppError('结算记录不存在', 404)
    if (settlement.status !== 0) {
      throw new AppError('只有待结算的记录才能驳回', 400)
    }

    await settlement.update({
      status: 2,
      rejectReason: reason
    })

    await notificationService.create({
      userId: settlement.creatorId,
      type: 'settlement',
      title: '结算驳回通知',
      content: `您的结算单${settlement.settlementNo}被驳回，原因：${reason}`,
      relatedId: settlement.id,
      relatedType: 'settlement'
    })

    return { id: settlement.id }
  },

  async batchSettle(ids: number[]) {
    const settlements = await Settlement.findAll({ where: { id: { [Op.in]: ids } } })
    for (const settlement of settlements) {
      if (settlement.status === 0) {
        await this.settle(settlement.id)
      }
    }
    return true
  },

  async getStats() {
    const total = await Settlement.count()
    const pending = await Settlement.count({ where: { status: 0 } })
    const settled = await Settlement.count({ where: { status: 1 } })
    const rejected = await Settlement.count({ where: { status: 2 } })

    const totalAmountResult = await Settlement.sum('amount', { where: { status: 1 } })
    const totalAmount = totalAmountResult || 0

    const pendingAmountResult = await Settlement.sum('amount', { where: { status: 0 } })
    const pendingAmount = pendingAmountResult || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Settlement.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    return {
      total,
      pending,
      settled,
      rejected,
      totalAmount,
      pendingAmount,
      todayNew
    }
  },

  async getCreatorStats(creatorId: number) {
    const total = await Settlement.count({ where: { creatorId } })
    const settled = await Settlement.count({ where: { creatorId, status: 1 } })
    const pending = await Settlement.count({ where: { creatorId, status: 0 } })

    const totalAmountResult = await Settlement.sum('amount', {
      where: { creatorId, status: 1 }
    })
    const totalAmount = totalAmountResult || 0

    const pendingAmountResult = await Settlement.sum('amount', {
      where: { creatorId, status: 0 }
    })
    const pendingAmount = pendingAmountResult || 0

    return {
      total,
      settled,
      pending,
      totalAmount,
      pendingAmount
    }
  }
}
