const { Op } = require('sequelize')
const { Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const riskService = require('../services/riskService')
const dispatchService = require('../services/dispatchService')
const orderStateMachine = require('../services/orderStateMachine')
const financeService = require('../services/financeService')
const orderService = require('../services/orderService')

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
      capacityType,
      payStatus,
      orderSource,
      serviceType
    } = req.query

    const where = {}

    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` }
    if (status !== undefined && status !== '') {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status.map(Number) }
      } else {
        where.status = Number(status)
      }
    }
    if (passengerName) where.passengerName = { [Op.like]: `%${passengerName}%` }
    if (driverName) where.driverName = { [Op.like]: `%${driverName}%` }
    if (capacityType) where.capacityType = capacityType
    if (serviceType) where.capacityType = serviceType
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

    const list = rows.map(row => {
      const item = row.toJSON()
      item.availableActions = orderService.getOrderActions(item.status)
      return item
    })

    res.json(pageResult(list, count, page, pageSize))
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

    const data = order.toJSON()
    data.availableActions = orderService.getOrderActions(data.status)

    res.json(success(data))
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

    await orderStateMachine.recordStatusLog(order, null, 1, {
      operatorType: 1,
      changeReason: '订单创建',
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
    })

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
    const { status, reason } = req.body

    await orderStateMachine.transitionOrder(id, status, { cancelReason: reason }, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorType: 1,
      changeReason: reason
    })

    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const dispatch = async (req, res, next) => {
  try {
    const { id } = req.params
    const { driverId } = req.body

    await dispatchService.dispatchOrder(id, driverId, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
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

    await orderStateMachine.transitionOrder(id, 6, { cancelReason: reason }, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorType: 1,
      changeReason: reason || '管理员取消'
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

const completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params

    await orderStateMachine.transitionOrder(id, 5, {}, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorType: 1,
      changeReason: '管理员手动完成'
    })
    await financeService.autoSettleOnComplete(id)

    res.json(success(null, '订单完成并自动结算成功'))
  } catch (error) {
    next(error)
  }
}

const batchDispatch = async (req, res, next) => {
  try {
    const result = await dispatchService.batchDispatch(req.body.orderIds, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
    })

    res.json(success(result, '批量派单完成'))
  } catch (error) {
    next(error)
  }
}

const getEditConditions = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await orderService.checkEditConditions(id)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const validatePrice = async (req, res, next) => {
  try {
    const { distance, capacityType = 1, estimatedPrice } = req.body
    const result = orderService.validatePriceMatch(
      parseFloat(distance),
      parseInt(capacityType),
      parseFloat(estimatedPrice)
    )
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const updateBaseInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await orderService.updateOrderBaseInfo(id, req.body, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
    })
    res.json(success(order, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const getStatusLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 20 } = req.query
    const result = await orderService.getOrderStatusLogs(id, page, pageSize)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const batchUpdatePriceRule = async (req, res, next) => {
  try {
    const { orderIds, priceRule } = req.body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new AppError('请选择要操作的订单', 400, 400)
    }

    const result = await orderService.batchUpdatePriceRule(orderIds, priceRule, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
    })

    res.json(success(result, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const getOrderTrace = async (req, res, next) => {
  try {
    const { orderNo } = req.params
    const traceData = await orderService.getOrderTrace(orderNo, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname
    })
    res.json(success(traceData))
  } catch (error) {
    next(error)
  }
}

const getTraceHistory = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const result = await orderService.getTraceHistory(req.user?.id, page, pageSize)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getAvailableActions = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findByPk(id)
    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }
    const actions = orderService.getOrderActions(order.status)
    res.json(success({ status: order.status, actions }))
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
  batchDispatch,
  getEditConditions,
  validatePrice,
  updateBaseInfo,
  getStatusLogs,
  batchUpdatePriceRule,
  getOrderTrace,
  getTraceHistory,
  getAvailableActions
}
