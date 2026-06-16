import { Order } from '@models/index'
import { AppError } from '@utils/response'
import { Op, fn, col } from 'sequelize'

export const orderService = {
  async list(params: { page: number; pageSize: number; keyword?: string; type?: string; status?: number }) {
    const { page, pageSize, keyword, type, status } = params
    const where: any = {}

    if (keyword) {
      where[Op.or] = [
        { orderNo: { [Op.like]: `%${keyword}%` } },
        { creatorName: { [Op.like]: `%${keyword}%` } },
        { activityName: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (type) where.type = type
    if (status !== undefined) where.status = status

    const { count, rows } = await Order.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const order = await Order.findByPk(id)
    if (!order) throw new AppError('订单不存在', 404)
    return order
  },

  async updateStatus(id: number, status: number, remark?: string) {
    const order = await Order.findByPk(id)
    if (!order) throw new AppError('订单不存在', 404)

    const updateData: any = { status }
    if (remark) updateData.remark = remark

    if (status === 1) updateData.paymentTime = new Date()
    if (status === 2) updateData.completeTime = new Date()
    if (status === 3) updateData.cancelTime = new Date()
    if (status === 4) updateData.refundTime = new Date()

    await order.update(updateData)
    return { id: order.id }
  },

  async settle(id: number) {
    const order = await Order.findByPk(id)
    if (!order) throw new AppError('订单不存在', 404)
    if (order.status !== 2) {
      throw new AppError('只有已完成的订单才能结算', 400)
    }
    await order.update({ status: 2 })
    return { id: order.id }
  },

  async batchSettle(ids: number[]) {
    await Order.update(
      { status: 2 },
      { where: { id: { [Op.in]: ids }, status: 2 } }
    )
    return true
  },

  async getStats() {
    const total = await Order.count()
    const pendingPayment = await Order.count({ where: { status: 0 } })
    const processing = await Order.count({ where: { status: 1 } })
    const completed = await Order.count({ where: { status: 2 } })
    const cancelled = await Order.count({ where: { status: 3 } })
    const refunded = await Order.count({ where: { status: 4 } })

    const totalAmountResult = await Order.sum('amount', { where: { status: 2 } })
    const totalAmount = totalAmountResult || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayNew = await Order.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const todayAmountResult = await Order.sum('amount', {
      where: { createTime: { [Op.gte]: todayStart }, status: 2 }
    })
    const todayAmount = todayAmountResult || 0

    return {
      total,
      pendingPayment,
      processing,
      completed,
      cancelled,
      refunded,
      totalAmount,
      todayNew,
      todayAmount
    }
  },

  async create(data: {
    orderNo: string
    type?: string
    activityId: number
    activityName: string
    creatorId: number
    creatorName: string
    amount: number
    remark?: string
  }) {
    const existing = await Order.findOne({ where: { orderNo: data.orderNo } })
    if (existing) throw new AppError('订单号已存在', 400)

    const order = await Order.create({ ...data, status: 0 } as any)
    return { id: order.id }
  },

  async update(id: number, data: Partial<{
    type: string
    activityId: number
    activityName: string
    creatorId: number
    creatorName: string
    amount: number
    remark: string
  }>) {
    const order = await Order.findByPk(id)
    if (!order) throw new AppError('订单不存在', 404)
    await order.update(data)
    return { id: order.id }
  },

  async remove(id: number) {
    const order = await Order.findByPk(id)
    if (!order) throw new AppError('订单不存在', 404)
    await order.destroy()
    return true
  },

  async batchUpdateStatus(ids: number[], status: number, remark?: string) {
    const updateData: any = { status }
    if (remark) updateData.remark = remark

    if (status === 1) updateData.paymentTime = new Date()
    if (status === 2) updateData.completeTime = new Date()
    if (status === 3) updateData.cancelTime = new Date()
    if (status === 4) updateData.refundTime = new Date()

    await Order.update(updateData, { where: { id: { [Op.in]: ids } } })
    return true
  },

  async getTrendData(days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const results = await Order.findAll({
      where: {
        createTime: { [Op.gte]: startDate }
      },
      attributes: [
        [fn('DATE', col('create_time')), 'date'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'amount']
      ],
      group: [fn('DATE', col('create_time'))],
      order: [[fn('DATE', col('create_time')), 'ASC']],
      raw: true
    })

    return results.map((item: any) => ({
      date: item.date,
      count: item.count,
      amount: item.amount || 0
    }))
  }
}
