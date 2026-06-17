const { Op } = require('sequelize')
const { Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const riskService = require('../services/riskService')
const dispatchService = require('../services/dispatchService')
const orderStateMachine = require('../services/orderStateMachine')
const financeService = require('../services/financeService')
const orderService = require('../services/orderService')

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
}

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
      operatorName: req.user?.nickname,
      operatorIP: getClientIP(req)
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
    const { status, reason, cancelType } = req.body

    const result = await orderStateMachine.transitionOrder(
      id,
      status,
      { cancelReason: reason },
      {
        operatorId: req.user?.id,
        operatorName: req.user?.nickname,
        operatorType: 1,
        operatorIP: getClientIP(req),
        changeReason: reason,
        cancelType: cancelType || (status === 6 ? 1 : undefined)
      }
    )

    if (!result.success) {
      res.json(success({
        success: false,
        prerequisiteFailures: result.prerequisiteFailures,
        message: result.message
      }, '前置条件校验失败'))
    } else {
      res.json(success(null, '状态更新成功'))
    }
  } catch (error) {
    next(error)
  }
}

const dispatch = async (req, res, next) => {
  try {
    const { id } = req.params
    const { driverId } = req.body

    const result = await orderStateMachine.transitionOrder(
      id,
      2,
      { driverId },
      {
        operatorId: req.user?.id,
        operatorName: req.user?.nickname,
        operatorType: 1,
        operatorIP: getClientIP(req),
        changeReason: '管理员派单'
      }
    )

    if (!result.success) {
      res.json(success({
        success: false,
        prerequisiteFailures: result.prerequisiteFailures,
        message: result.message
      }, '派单前置条件校验失败'))
    } else {
      res.json(success(null, '派单成功'))
    }
  } catch (error) {
    next(error)
  }
}

const cancel = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason, cancelType } = req.body

    const result = await orderStateMachine.transitionOrder(
      id,
      6,
      { cancelReason: reason },
      {
        operatorId: req.user?.id,
        operatorName: req.user?.nickname,
        operatorType: 1,
        operatorIP: getClientIP(req),
        cancelType: cancelType || orderStateMachine.CANCEL_TYPES.PASSENGER,
        changeReason: reason || '管理员取消'
      }
    )

    if (!result.success) {
      res.json(success({
        success: false,
        prerequisiteFailures: result.prerequisiteFailures,
        message: result.message
      }, '取消前置条件校验失败'))
    } else {
      res.json(success(null, '取消成功'))
    }
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

    const result = await orderStateMachine.transitionOrder(id, 5, {}, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorType: 1,
      operatorIP: getClientIP(req),
      changeReason: '管理员手动完成'
    })

    if (!result.success) {
      res.json(success({
        success: false,
        prerequisiteFailures: result.prerequisiteFailures,
        message: result.message
      }, '完成前置条件校验失败'))
    } else {
      await financeService.autoSettleOnComplete(id)
      res.json(success(null, '订单完成并自动结算成功'))
    }
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

const getTransitionPrerequisites = async (req, res, next) => {
  try {
    const { id } = req.params
    const { targetStatus } = req.query

    if (!targetStatus) {
      throw new AppError('请指定目标状态', 400, 400)
    }

    const order = await Order.findByPk(id)
    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    const result = await orderStateMachine.validateTransitionPrerequisites(
      order,
      parseInt(targetStatus),
      req.body
    )
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getCancelStatistics = async (req, res, next) => {
  try {
    const result = await orderStateMachine.getCancelStatistics()
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getAbnormalOrders = async (req, res, next) => {
  try {
    const { type = 'all', page = 1, pageSize = 20 } = req.query
    const result = await orderStateMachine.getAbnormalOrders(type, page, pageSize)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const batchAbnormalOperation = async (req, res, next) => {
  try {
    const { orderIds, operation } = req.body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new AppError('请选择要操作的订单', 400, 400)
    }

    if (!['retry_dispatch', 'mark_abnormal', 'force_close', 'reset_status'].includes(operation)) {
      throw new AppError('不支持的操作类型', 400, 400)
    }

    if (operation === 'reset_status' && req.user?.role !== 1) {
      throw new AppError('仅超级管理员可重置异常状态', 403, 403)
    }

    const result = await orderStateMachine.batchAbnormalOperation(orderIds, operation, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorIP: getClientIP(req)
    })

    res.json(success(result, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const getViolationLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, handled } = req.query
    const result = await orderStateMachine.getViolationLogs({ page, pageSize, handled: handled !== undefined ? parseInt(handled) : undefined })
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getFlowDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await orderStateMachine.getFlowDetail(id)
    res.json(success(result))
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
  getAvailableActions,
  getTransitionPrerequisites,
  getCancelStatistics,
  getAbnormalOrders,
  batchAbnormalOperation,
  getViolationLogs,
  getFlowDetail
}
