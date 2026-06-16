const { Op } = require('sequelize')
const { Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const riskService = require('../services/riskService')
const dispatchService = require('../services/dispatchService')
const orderStateMachine = require('../services/orderStateMachine')
const financeService = require('../services/financeService')

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

    const orderConditions = []
    if (where.status && where.createTime) {
      orderConditions.push(['status', 'ASC'], ['createTime', 'DESC'])
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: orderConditions.length > 0 ? orderConditions : [['createTime', 'DESC']],
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

    await riskService.checkOrderRisk(data)

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

    await orderStateMachine.transitionOrder(id, status, req.body)

    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const dispatch = async (req, res, next) => {
  try {
    const { id } = req.params
    const { driverId } = req.body

    await dispatchService.dispatchOrder(id, driverId)

    res.json(success(null, '派单成功'))
  } catch (error) {
    next(error)
  }
}

const cancel = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    await orderStateMachine.transitionOrder(id, 6, { cancelReason: reason })

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

const completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params

    await orderStateMachine.transitionOrder(id, 5)
    await financeService.autoSettleOnComplete(id)

    res.json(success(null, '订单完成并自动结算成功'))
  } catch (error) {
    next(error)
  }
}

const batchDispatch = async (req, res, next) => {
  try {
    const result = await dispatchService.batchDispatch(req.body.orderIds)

    res.json(success(result, '批量派单完成'))
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
  getStatistics,
  completeOrder,
  batchDispatch
}
