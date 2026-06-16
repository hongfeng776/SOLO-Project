import { Order } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'

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
  }
}
