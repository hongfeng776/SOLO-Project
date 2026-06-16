const { Op } = require('sequelize')
const { Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      orderNo,
      status,
      passengerName,
      driverName,
      startTime,
      endTime,
      capacityType
    } = req.query

    const where = {}

    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` }
    if (status !== undefined && status !== '') where.status = status
    if (passengerName) where.passengerName = { [Op.like]: `%${passengerName}%` }
    if (driverName) where.driverName = { [Op.like]: `%${driverName}%` }
    if (capacityType) where.capacityType = capacityType
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [startTime, endTime] }
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    res.json(success(order))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body

    if (!data.orderNo) {
      data.orderNo = 'DD' + Date.now() + Math.floor(Math.random() * 1000)
    }

    const order = await Order.create(data)

    res.json(success(order, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    await order.update(data)

    res.json(success(order, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    await order.destroy()

    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    await order.update({ status })

    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const dispatch = async (req, res, next) => {
  try {
    const { id } = req.params
    const { driverId } = req.body

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    if (order.status !== 1) {
      throw new AppError('只有待接单状态的订单才能派单', 400, 400)
    }

    await order.update({
      driverId,
      status: 2,
      acceptTime: new Date()
    })

    res.json(success(null, '派单成功'))
  } catch (error) {
    next(error)
  }
}

const cancel = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const order = await Order.findByPk(id)

    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    if (order.status === 5 || order.status === 6) {
      throw new AppError('订单已完成或已取消，无法再次取消', 400, 400)
    }

    await order.update({
      status: 6,
      cancelTime: new Date(),
      cancelReason: reason || '后台取消'
    })

    res.json(success(null, '取消成功'))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const todayOrders = await Order.count({
      where: {
        createTime: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    const pendingOrders = await Order.count({ where: { status: 1 } })

    const completedOrders = await Order.count({ where: { status: 5 } })

    const totalRevenue = await Order.sum('actualPrice', { where: { status: 5 } }) || 0

    res.json(success({
      todayOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      onlineDrivers: 86,
      activeUsers: 356
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteOrder,
  updateStatus,
  dispatch,
  cancel,
  getStatistics
}
