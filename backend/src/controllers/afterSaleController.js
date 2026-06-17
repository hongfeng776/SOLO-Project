const { Op } = require('sequelize')
const { Ticket, TicketAuditLog, ReputationRecord, Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const afterSaleService = require('../services/afterSaleService')

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
}

const getOperatorInfo = (req) => ({
  operatorId: req.user?.id,
  operatorName: req.user?.nickname,
  operatorRole: req.user?.role?.toString(),
  operatorIP: getClientIP(req)
})

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      disputeType,
      priority,
      orderNo,
      passengerPhone,
      assigneeId,
      isOverdue,
      filterType
    } = req.query

    if (filterType) {
      const result = await afterSaleService.getFilteredTickets(filterType, page, pageSize)
      res.json(success(result))
      return
    }

    const where = {}
    if (status !== undefined && status !== '') where.status = status
    if (disputeType !== undefined && disputeType !== '') where.disputeType = disputeType
    if (priority !== undefined && priority !== '') where.priority = priority
    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` }
    if (passengerPhone) where.passengerPhone = { [Op.like]: `%${passengerPhone}%` }
    if (assigneeId) where.assigneeId = assigneeId
    if (isOverdue !== undefined && isOverdue !== '') where.isOverdue = isOverdue

    const { count, rows } = await Ticket.findAndCountAll({
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
    const ticket = await Ticket.findByPk(id, {
      include: [
        { association: 'order', attributes: ['orderNo', 'status', 'estimatedPrice', 'actualPrice', 'distance', 'duration', 'startAddress', 'endAddress', 'completeTime'] }
      ]
    })
    if (!ticket) throw new AppError('售后工单不存在', 404, 404)
    res.json(success(ticket))
  } catch (error) {
    next(error)
  }
}

const getPrerequisites = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { passengerId } = req.query

    if (!passengerId) {
      throw new AppError('缺少乘客ID', 400, 400)
    }

    const result = await afterSaleService.validateSubmitPrerequisites(
      parseInt(orderId),
      parseInt(passengerId)
    )

    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const submitAfterSale = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const submitData = req.body

    if (!submitData.passengerId) {
      submitData.passengerId = req.user?.passengerId
      submitData.passengerName = req.user?.nickname
      submitData.passengerPhone = req.user?.phone
    }

    const result = await afterSaleService.submitAfterSale(
      parseInt(orderId),
      submitData,
      getOperatorInfo(req)
    )

    res.json(success(result, '售后工单提交成功'))
  } catch (error) {
    next(error)
  }
}

const processTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { targetStatus, handleResult, rejectReason, actualRefundAmount, remark } = req.body

    const result = await afterSaleService.processTicketStatus(
      parseInt(id),
      parseInt(targetStatus),
      { handleResult, rejectReason, actualRefundAmount, remark },
      getOperatorInfo(req)
    )

    res.json(success(result, '处理成功'))
  } catch (error) {
    next(error)
  }
}

const resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { handleResult, actualRefundAmount, remark } = req.body

    const result = await afterSaleService.processTicketStatus(
      parseInt(id),
      afterSaleService.TICKET_STATUS.RESOLVED,
      { handleResult, actualRefundAmount, remark },
      getOperatorInfo(req)
    )

    res.json(success(result, '工单已解决'))
  } catch (error) {
    next(error)
  }
}

const rejectTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rejectReason, remark } = req.body

    const result = await afterSaleService.processTicketStatus(
      parseInt(id),
      afterSaleService.TICKET_STATUS.REJECTED,
      { rejectReason, remark },
      getOperatorInfo(req)
    )

    res.json(success(result, '工单已驳回'))
  } catch (error) {
    next(error)
  }
}

const closeTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { remark } = req.body

    const result = await afterSaleService.processTicketStatus(
      parseInt(id),
      afterSaleService.TICKET_STATUS.CLOSED,
      { remark },
      getOperatorInfo(req)
    )

    res.json(success(result, '工单已关闭'))
  } catch (error) {
    next(error)
  }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const where = { ticketId: parseInt(ticketId) }

    const { count, rows } = await TicketAuditLog.findAndCountAll({
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

const getBatchPreview = async (req, res, next) => {
  try {
    const { filterType, status, disputeType, startTime, endTime } = req.query

    const where = {}
    const now = new Date()

    switch (filterType) {
      case 'overdue':
        where.status = { [Op.in]: [
          afterSaleService.TICKET_STATUS.PENDING_REVIEW,
          afterSaleService.TICKET_STATUS.REVIEWING
        ]}
        where.deadline = { [Op.lt]: now }
        break
      case 'pending_review':
        where.status = afterSaleService.TICKET_STATUS.REVIEWING
        where.reviewStep = { [Op.gte]: afterSaleService.REVIEW_STEP.SECOND }
        break
      case 'rejected':
        where.status = afterSaleService.TICKET_STATUS.REJECTED
        break
    }

    if (status !== undefined && status !== '') where.status = status
    if (disputeType !== undefined && disputeType !== '') where.disputeType = disputeType
    if (startTime) where.createTime = { ...where.createTime, [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...where.createTime, [Op.lte]: new Date(endTime) }

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      attributes: ['id', 'ticketNo', 'orderNo', 'status', 'disputeType', 'passengerName', 'createTime', 'deadline', 'isOverdue'],
      order: [['createTime', 'DESC']],
      limit: 100
    })

    const excluded = []
    const eligible = []

    for (const ticket of rows) {
      if (ticket.status === afterSaleService.TICKET_STATUS.CLOSED ||
          ticket.status === afterSaleService.TICKET_STATUS.RESOLVED) {
        excluded.push({
          id: ticket.id,
          ticketNo: ticket.ticketNo,
          orderNo: ticket.orderNo,
          reason: '工单已处理完成'
        })
      } else {
        eligible.push(ticket)
      }
    }

    res.json(success({
      total: rows.length,
      eligibleCount: eligible.length,
      excludedCount: excluded.length,
      eligible,
      excluded
    }))
  } catch (error) {
    next(error)
  }
}

const batchOperation = async (req, res, next) => {
  try {
    const { ids, operation } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的工单', 400, 400)
    }

    if (!['urge', 'review', 'close'].includes(operation)) {
      throw new AppError('无效的操作类型', 400, 400)
    }

    const role = req.user?.role
    if (operation === 'review' && role !== 1 && role !== 6) {
      throw new AppError('仅售后管理员可执行批量复核', 403, 403)
    }

    const result = await afterSaleService.batchOperation(
      ids,
      operation,
      getOperatorInfo(req)
    )

    res.json(success(result, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const getTrace = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await afterSaleService.getTicketTrace(parseInt(id))
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const result = await afterSaleService.getTicketStatistics()
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getReputationRecords = async (req, res, next) => {
  try {
    const { passengerId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const { count, rows } = await ReputationRecord.findAndCountAll({
      where: { passengerId: parseInt(passengerId) },
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  getPrerequisites,
  submitAfterSale,
  processTicket,
  resolveTicket,
  rejectTicket,
  closeTicket,
  getAuditLogs,
  getBatchPreview,
  batchOperation,
  getTrace,
  getStatistics,
  getReputationRecords
}
