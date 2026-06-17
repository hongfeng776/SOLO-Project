const { Op } = require('sequelize')
const { Ticket, TicketAuditLog, ReputationRecord, Order, Passenger, User } = require('../models')
const { AppError, pageResult } = require('../utils/response')

const DISPUTE_TYPE = {
  FEE_DISPUTE: 1,
  SERVICE_COMPLAINT: 2,
  LOST_ITEM: 3
}

const TICKET_STATUS = {
  PENDING_REVIEW: 1,
  REVIEWING: 2,
  RESOLVED: 3,
  REJECTED: 4,
  CLOSED: 5
}

const REVIEW_STEP = {
  FIRST: 1,
  SECOND: 2,
  FINAL: 3
}

const AFTER_SALE_VALID_DAYS = 30
const MAX_EVIDENCE_COUNT = 9
const MIN_EVIDENCE_COUNT = 1

const DISPUTE_AUDITOR_MAP = {
  [DISPUTE_TYPE.FEE_DISPUTE]: { role: 'finance_auditor', priority: 3, step: 3, deadlineHours: 24 },
  [DISPUTE_TYPE.SERVICE_COMPLAINT]: { role: 'service_auditor', priority: 2, step: 2, deadlineHours: 48 },
  [DISPUTE_TYPE.LOST_ITEM]: { role: 'logistics_auditor', priority: 4, step: 2, deadlineHours: 72 }
}

const REPUTATION_RULES = {
  TICKET_RESOLVED_REFUND: { change: -5, reason: '售后退款成功' },
  TICKET_RESOLVED_COMPLAINT: { change: -3, reason: '服务投诉成立' },
  TICKET_REJECTED_FALSE: { change: -2, reason: '恶意售后申请驳回' },
  TICKET_REJECTED_NORMAL: { change: 0, reason: '售后申请正常驳回' },
  TICKET_DUPLICATE: { change: -1, reason: '重复提交售后工单' }
}

const submitLocks = new Map()

const validateSubmitPrerequisites = async (orderId, passengerId) => {
  const result = {
    isEligible: true,
    orderCompleted: false,
    withinValidPeriod: false,
    hasDuplicateTicket: false,
    order: null,
    duplicateTicket: null,
    messages: []
  }

  const order = await Order.findByPk(orderId)
  if (!order) {
    result.isEligible = false
    result.messages.push('订单不存在')
    return result
  }
  result.order = order

  if (order.status !== 5) {
    result.isEligible = false
    result.messages.push('订单未完成，无法发起售后')
  } else {
    result.orderCompleted = true
  }

  if (order.passengerId !== passengerId) {
    result.isEligible = false
    result.messages.push('订单不属于当前用户')
    return result
  }

  const completeTime = order.completeTime || order.updateTime
  const daysSinceComplete = Math.floor((Date.now() - new Date(completeTime).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceComplete > AFTER_SALE_VALID_DAYS) {
    result.isEligible = false
    result.messages.push(`售后时效已过（${AFTER_SALE_VALID_DAYS}天内有效）`)
  } else {
    result.withinValidPeriod = true
  }

  const existingTicket = await Ticket.findOne({
    where: {
      orderId,
      status: { [Op.in]: [TICKET_STATUS.PENDING_REVIEW, TICKET_STATUS.REVIEWING, TICKET_STATUS.RESOLVED] },
      isDuplicate: 0
    },
    order: [['createTime', 'DESC']]
  })

  if (existingTicket) {
    result.isEligible = false
    result.hasDuplicateTicket = true
    result.duplicateTicket = existingTicket
    result.messages.push('该订单已有进行中的售后工单')
  }

  return result
}

const validateSubmitData = (data, disputeType) => {
  const errors = []
  const warnings = []

  if (!disputeType || ![1, 2, 3].includes(parseInt(disputeType))) {
    errors.push('请选择有效的纠纷类型')
  }

  if (!data.content || data.content.trim().length < 10) {
    errors.push('请详细描述问题内容（至少10个字符）')
  }

  const evidenceCount = data.evidences ? (Array.isArray(data.evidences) ? data.evidences.length : 0) : 0
  data.evidenceCount = evidenceCount

  if (disputeType == DISPUTE_TYPE.FEE_DISPUTE) {
    if (!data.refundAmount || parseFloat(data.refundAmount) <= 0) {
      errors.push('请填写申请退款金额')
    }
    if (evidenceCount < MIN_EVIDENCE_COUNT) {
      errors.push('费用争议需至少上传1张凭证')
    }
  } else if (disputeType == DISPUTE_TYPE.SERVICE_COMPLAINT) {
    if (evidenceCount < MIN_EVIDENCE_COUNT) {
      warnings.push('建议上传相关凭证以便快速审核')
    }
  } else if (disputeType == DISPUTE_TYPE.LOST_ITEM) {
    if (evidenceCount < 2) {
      warnings.push('物品遗失建议上传物品照片和订单截图')
    }
  }

  if (evidenceCount > MAX_EVIDENCE_COUNT) {
    errors.push(`凭证数量不能超过${MAX_EVIDENCE_COUNT}张`)
  }

  return { errors, warnings, isValid: errors.length === 0 }
}

const checkDuplicateSubmit = (orderId, passengerId) => {
  const key = `${orderId}_${passengerId}`
  const now = Date.now()
  const lastSubmit = submitLocks.get(key)

  if (lastSubmit && now - lastSubmit < 3000) {
    submitLocks.set(key, now)
    return { isDuplicate: true, waitTime: Math.ceil((3000 - (now - lastSubmit)) / 1000) }
  }

  submitLocks.set(key, now)

  setTimeout(() => {
    submitLocks.delete(key)
  }, 5000)

  return { isDuplicate: false }
}

const getAvailableAuditor = async (role) => {
  const auditor = await User.findOne({
    where: { status: 1 },
    include: [{
      association: 'roleInfo',
      where: { roleCode: role }
    }],
    attributes: ['id', 'nickname'],
    order: [['id', 'ASC']]
  })

  if (auditor) {
    return { id: auditor.id, name: auditor.nickname }
  }

  return { id: 1, name: '系统管理员' }
}

const assignAuditorByDisputeType = async (disputeType) => {
  const config = DISPUTE_AUDITOR_MAP[disputeType] || DISPUTE_AUDITOR_MAP[DISPUTE_TYPE.FEE_DISPUTE]
  const auditor = await getAvailableAuditor(config.role)

  return {
    assigneeId: auditor.id,
    assigneeName: auditor.name,
    priority: config.priority,
    reviewStep: config.step,
    deadline: new Date(Date.now() + config.deadlineHours * 60 * 60 * 1000)
  }
}

const updatePassengerReputation = async (passengerId, ticketId, ruleKey, operatorInfo, extraDetail = '') => {
  const rule = REPUTATION_RULES[ruleKey]
  if (!rule) return null

  const passenger = await Passenger.findByPk(passengerId)
  if (!passenger) return null

  const currentScore = passenger.reputationScore || 100
  const changeAmount = rule.change * (rule.change < 0 ? -1 : 1)
  const newScore = Math.max(0, Math.min(100, currentScore + changeAmount))

  const record = await ReputationRecord.create({
    recordNo: 'REP' + Date.now() + Math.floor(Math.random() * 1000),
    passengerId: passenger.id,
    passengerName: passenger.name,
    passengerPhone: passenger.phone,
    ticketId: ticketId,
    changeType: ruleKey,
    changeDirection: changeAmount >= 0 ? 1 : -1,
    beforeScore: currentScore,
    changeAmount: Math.abs(changeAmount),
    afterScore: newScore,
    reason: rule.reason,
    detail: extraDetail,
    operatorId: operatorInfo?.operatorId,
    operatorName: operatorInfo?.operatorName,
    operatorIP: operatorInfo?.operatorIP
  })

  await passenger.update({ reputationScore: newScore })

  return record
}

const createAuditLog = async (ticket, operationType, operatorInfo, extraData = {}) => {
  return await TicketAuditLog.create({
    ticketId: ticket.id,
    ticketNo: ticket.ticketNo,
    orderId: ticket.orderId,
    orderNo: ticket.orderNo,
    operationType,
    oldStatus: extraData.oldStatus,
    newStatus: ticket.status,
    oldReviewStep: extraData.oldReviewStep,
    newReviewStep: ticket.reviewStep,
    operatorId: operatorInfo?.operatorId,
    operatorName: operatorInfo?.operatorName,
    operatorRole: operatorInfo?.operatorRole,
    operatorIP: operatorInfo?.operatorIP,
    assigneeId: ticket.assigneeId,
    assigneeName: ticket.assigneeName,
    content: extraData.content,
    remark: extraData.remark,
    rejectReason: extraData.rejectReason,
    refundAmount: extraData.refundAmount,
    reputationImpact: extraData.reputationImpact,
    hasException: extraData.hasException || 0,
    exceptionType: extraData.exceptionType,
    exceptionDetail: extraData.exceptionDetail,
    validationResult: extraData.validationResult
  })
}

const submitAfterSale = async (orderId, submitData, operatorInfo) => {
  const passengerId = submitData.passengerId

  const prerequisites = await validateSubmitPrerequisites(orderId, passengerId)
  if (!prerequisites.isEligible) {
    throw new AppError(prerequisites.messages.join('；'), 400, 400)
  }

  const duplicateCheck = checkDuplicateSubmit(orderId, passengerId)
  if (duplicateCheck.isDuplicate) {
    throw new AppError(`提交过于频繁，请${duplicateCheck.waitTime}秒后重试`, 429, 429)
  }

  const disputeType = parseInt(submitData.disputeType)
  const validation = validateSubmitData(submitData, disputeType)
  if (!validation.isValid) {
    const error = new AppError(validation.errors.join('；'), 400, 400)
    error.warnings = validation.warnings
    error.missingFields = validation.errors
    throw error
  }

  const assignment = await assignAuditorByDisputeType(disputeType)

  const order = prerequisites.order

  const recentTickets = await Ticket.findAll({
    where: {
      passengerId,
      createTime: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  })

  let isDuplicate = 0
  let duplicateTicketId = null
  if (recentTickets.length >= 3) {
    isDuplicate = 1
    duplicateTicketId = recentTickets[0].id
    await updatePassengerReputation(passengerId, null, 'TICKET_DUPLICATE', operatorInfo, '24小时内提交3次以上售后工单')
  }

  const ticket = await Ticket.create({
    ticketNo: 'AS' + Date.now() + Math.floor(Math.random() * 1000),
    orderId: order.id,
    orderNo: order.orderNo,
    passengerId,
    passengerName: submitData.passengerName || order.passengerName,
    passengerPhone: submitData.passengerPhone || order.passengerPhone,
    driverId: order.driverId,
    driverName: order.driverName,
    type: 2,
    disputeType,
    priority: assignment.priority,
    status: TICKET_STATUS.PENDING_REVIEW,
    reviewStep: assignment.reviewStep,
    category: getCategoryByDisputeType(disputeType),
    content: submitData.content,
    evidences: submitData.evidences || [],
    evidenceCount: submitData.evidenceCount || 0,
    refundAmount: submitData.refundAmount || 0,
    assigneeId: assignment.assigneeId,
    assigneeName: assignment.assigneeName,
    deadline: assignment.deadline,
    isDuplicate,
    duplicateTicketId,
    remark: validation.warnings.length > 0 ? validation.warnings.join('；') : null
  })

  await createAuditLog(ticket, 'submit', null, {
    oldStatus: null,
    content: submitData.content,
    validationResult: { validation, prerequisites }
  })

  return {
    ticket,
    prerequisites,
    validation,
    duplicateCheck
  }
}

const getCategoryByDisputeType = (disputeType) => {
  const map = {
    [DISPUTE_TYPE.FEE_DISPUTE]: '费用争议',
    [DISPUTE_TYPE.SERVICE_COMPLAINT]: '服务投诉',
    [DISPUTE_TYPE.LOST_ITEM]: '物品遗失'
  }
  return map[disputeType] || '其他'
}

const processTicketStatus = async (ticketId, targetStatus, processData, operatorInfo) => {
  const ticket = await Ticket.findByPk(ticketId)
  if (!ticket) {
    throw new AppError('售后工单不存在', 404, 404)
  }

  const oldStatus = ticket.status
  const oldReviewStep = ticket.reviewStep

  if (oldStatus === TICKET_STATUS.CLOSED) {
    throw new AppError('工单已关闭，无法处理', 400, 400)
  }

  const validTransitions = {
    [TICKET_STATUS.PENDING_REVIEW]: [TICKET_STATUS.REVIEWING, TICKET_STATUS.RESOLVED, TICKET_STATUS.REJECTED, TICKET_STATUS.CLOSED],
    [TICKET_STATUS.REVIEWING]: [TICKET_STATUS.RESOLVED, TICKET_STATUS.REJECTED, TICKET_STATUS.CLOSED],
    [TICKET_STATUS.RESOLVED]: [TICKET_STATUS.CLOSED],
    [TICKET_STATUS.REJECTED]: [TICKET_STATUS.REVIEWING, TICKET_STATUS.CLOSED]
  }

  if (!validTransitions[oldStatus]?.includes(targetStatus)) {
    throw new AppError(`无法从${oldStatus}状态变更为${targetStatus}状态`, 400, 400)
  }

  const validation = validateProcessingResult(ticket, targetStatus, processData)
  const hasException = !validation.isCompliant

  let reputationImpact = 0
  if (targetStatus === TICKET_STATUS.RESOLVED) {
    if (ticket.disputeType === DISPUTE_TYPE.FEE_DISPUTE) {
      const record = await updatePassengerReputation(
        ticket.passengerId,
        ticketId,
        'TICKET_RESOLVED_REFUND',
        operatorInfo,
        `退款金额：${processData.actualRefundAmount || ticket.refundAmount}元`
      )
      reputationImpact = record ? -Math.abs(record.changeAmount) : 0
    } else if (ticket.disputeType === DISPUTE_TYPE.SERVICE_COMPLAINT) {
      const record = await updatePassengerReputation(
        ticket.passengerId,
        ticketId,
        'TICKET_RESOLVED_COMPLAINT',
        operatorInfo,
        processData.handleResult
      )
      reputationImpact = record ? -Math.abs(record.changeAmount) : 0
    }
  } else if (targetStatus === TICKET_STATUS.REJECTED) {
    const ruleKey = hasException ? 'TICKET_REJECTED_FALSE' : 'TICKET_REJECTED_NORMAL'
    const record = await updatePassengerReputation(
      ticket.passengerId,
      ticketId,
      ruleKey,
      operatorInfo,
      processData.rejectReason
    )
    reputationImpact = record ? -Math.abs(record.changeAmount) : 0
  }

  const updateData = {
    status: targetStatus,
    handlerId: operatorInfo.operatorId,
    handlerName: operatorInfo.operatorName,
    handlerRole: operatorInfo.operatorRole,
    handleTime: new Date(),
    handleResult: processData.handleResult,
    rejectReason: processData.rejectReason,
    actualRefundAmount: processData.actualRefundAmount,
    reputationImpact,
    hasException: hasException ? 1 : 0,
    exceptionType: hasException ? validation.exceptionType : null,
    exceptionDetail: hasException ? validation.exceptionDetail : null
  }

  if (targetStatus === TICKET_STATUS.REVIEWING) {
    updateData.reviewStep = Math.min(REVIEW_STEP.FINAL, oldReviewStep + 1)
  }

  await ticket.update(updateData)

  await createAuditLog(ticket, getOperationTypeByStatus(targetStatus), operatorInfo, {
    oldStatus,
    oldReviewStep,
    content: processData.handleResult,
    remark: processData.remark,
    rejectReason: processData.rejectReason,
    refundAmount: processData.actualRefundAmount,
    reputationImpact,
    hasException: hasException ? 1 : 0,
    exceptionType: hasException ? validation.exceptionType : null,
    exceptionDetail: hasException ? validation.exceptionDetail : null,
    validationResult: validation
  })

  return { ticket, validation, reputationImpact }
}

const getOperationTypeByStatus = (status) => {
  const map = {
    [TICKET_STATUS.PENDING_REVIEW]: 'submit',
    [TICKET_STATUS.REVIEWING]: 'process',
    [TICKET_STATUS.RESOLVED]: 'resolve',
    [TICKET_STATUS.REJECTED]: 'reject',
    [TICKET_STATUS.CLOSED]: 'close'
  }
  return map[status] || 'update'
}

const validateProcessingResult = (ticket, targetStatus, processData) => {
  const result = {
    isCompliant: true,
    score: 100,
    exceptions: [],
    warnings: [],
    passItems: [],
    exceptionType: null,
    exceptionDetail: null
  }

  if (targetStatus === TICKET_STATUS.RESOLVED) {
    if (!processData.handleResult || processData.handleResult.length < 5) {
      result.exceptions.push('请填写详细的处理结果')
      result.score -= 20
    }

    if (ticket.disputeType === DISPUTE_TYPE.FEE_DISPUTE) {
      const actualRefund = parseFloat(processData.actualRefundAmount) || 0
      const applyRefund = parseFloat(ticket.refundAmount) || 0

      if (actualRefund <= 0) {
        result.exceptions.push('请填写实际退款金额')
        result.score -= 30
      }

      if (actualRefund > applyRefund * 1.5) {
        result.exceptions.push(`退款金额(${actualRefund})超出申请金额(${applyRefund})的50%`)
        result.exceptionType = 'refund_over_limit'
        result.exceptionDetail = `申请退款${applyRefund}元，实际退款${actualRefund}元，超出50%限制`
        result.score -= 40
      }

      if (actualRefund > 500) {
        result.warnings.push('退款金额较大，建议复核')
        result.score -= 10
      }
    }
  } else if (targetStatus === TICKET_STATUS.REJECTED) {
    if (!processData.rejectReason || processData.rejectReason.length < 5) {
      result.exceptions.push('请填写详细的驳回原因')
      result.score -= 20
    }
  }

  if (targetStatus === TICKET_STATUS.CLOSED && ticket.status === TICKET_STATUS.PENDING_REVIEW) {
    result.warnings.push('待审核工单直接关闭，建议确认')
    result.score -= 15
  }

  result.isCompliant = result.exceptions.length === 0
  return result
}

const getFilteredTickets = async (filterType, page = 1, pageSize = 20) => {
  const where = {}
  const now = new Date()

  switch (filterType) {
    case 'overdue':
      where.status = { [Op.in]: [TICKET_STATUS.PENDING_REVIEW, TICKET_STATUS.REVIEWING] }
      where.deadline = { [Op.lt]: now }
      where.isOverdue = 0
      break
    case 'pending_review':
      where.status = TICKET_STATUS.REVIEWING
      where.reviewStep = { [Op.gte]: REVIEW_STEP.SECOND }
      break
    case 'rejected':
      where.status = TICKET_STATUS.REJECTED
      break
    case 'all':
    default:
      break
  }

  const { count, rows } = await Ticket.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  const overdueIds = []
  for (const ticket of rows) {
    if (ticket.deadline && new Date(ticket.deadline) < now && ticket.status < TICKET_STATUS.RESOLVED) {
      overdueIds.push(ticket.id)
    }
  }

  if (overdueIds.length > 0) {
    await Ticket.update({ isOverdue: 1 }, { where: { id: { [Op.in]: overdueIds } } })
  }

  return pageResult(rows, count, page, pageSize)
}

const batchOperation = async (ticketIds, operation, operatorInfo) => {
  const result = {
    total: ticketIds.length,
    success: 0,
    failed: 0,
    failedOrders: []
  }

  let targetStatus = null
  switch (operation) {
    case 'urge':
      for (const ticketId of ticketIds) {
        try {
          const ticket = await Ticket.findByPk(ticketId)
          if (!ticket) continue

          if (ticket.deadline) {
            const newDeadline = new Date(ticket.deadline)
            newDeadline.setHours(newDeadline.getHours() - 2)
            await ticket.update({ deadline: newDeadline, priority: Math.min(4, ticket.priority + 1) })
          }

          await createAuditLog(ticket, 'urge', operatorInfo, {
            oldStatus: ticket.status,
            content: '系统自动催办，截止时间提前2小时'
          })
          result.success++
        } catch (error) {
          result.failed++
          result.failedOrders.push({ id: ticketId, reason: error.message })
        }
      }
      return result

    case 'review':
      targetStatus = TICKET_STATUS.REVIEWING
      break
    case 'close':
      targetStatus = TICKET_STATUS.CLOSED
      break
    default:
      throw new AppError('无效的批量操作类型', 400, 400)
  }

  for (const ticketId of ticketIds) {
    try {
      await processTicketStatus(
        ticketId,
        targetStatus,
        { handleResult: `批量${operation === 'review' ? '复核' : '关闭'}`, remark: '批量操作' },
        operatorInfo
      )
      result.success++
    } catch (error) {
      result.failed++
      result.failedOrders.push({ id: ticketId, reason: error.message })
    }
  }

  return result
}

const getTicketTrace = async (ticketId) => {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      { association: 'order', attributes: ['orderNo', 'status', 'estimatedPrice', 'actualPrice', 'distance', 'duration', 'startAddress', 'endAddress', 'completeTime'] },
      { association: 'auditLogs', separate: true, order: [['createTime', 'ASC']] }
    ]
  })

  if (!ticket) {
    throw new AppError('售后工单不存在', 404, 404)
  }

  const reputationRecords = await ReputationRecord.findAll({
    where: { ticketId },
    order: [['createTime', 'ASC']]
  })

  const validation = validateProcessingResult(ticket, ticket.status, {
    handleResult: ticket.handleResult,
    rejectReason: ticket.rejectReason,
    actualRefundAmount: ticket.actualRefundAmount
  })

  const similarTickets = await Ticket.findAll({
    where: {
      passengerId: ticket.passengerId,
      disputeType: ticket.disputeType,
      id: { [Op.ne]: ticket.id }
    },
    limit: 5,
    order: [['createTime', 'DESC']]
  })

  const riskChecks = []
  if (ticket.isDuplicate) {
    riskChecks.push({ type: 'duplicate', level: 'warning', message: '该工单被标记为重复提交' })
  }
  if (ticket.hasException) {
    riskChecks.push({ type: 'exception', level: 'error', message: ticket.exceptionDetail || '存在处理异常' })
  }
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(w => riskChecks.push({ type: 'warning', level: 'warning', message: w }))
  }

  const submissionTimeline = ticket.auditLogs.map(log => ({
    time: log.createTime,
    operator: log.operatorName || '系统',
    operation: log.operationType,
    status: log.newStatus,
    content: log.content,
    remark: log.remark
  }))

  return {
    ticket,
    order: ticket.order,
    auditLogs: ticket.auditLogs,
    reputationRecords,
    similarTickets,
    validation,
    riskChecks,
    submissionTimeline
  }
}

const getTicketStatistics = async () => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalPending,
    totalReviewing,
    totalResolved,
    totalRejected,
    totalOverdue,
    todayCreated,
    todayResolved
  ] = await Promise.all([
    Ticket.count({ where: { status: TICKET_STATUS.PENDING_REVIEW } }),
    Ticket.count({ where: { status: TICKET_STATUS.REVIEWING } }),
    Ticket.count({ where: { status: TICKET_STATUS.RESOLVED } }),
    Ticket.count({ where: { status: TICKET_STATUS.REJECTED } }),
    Ticket.count({ where: { isOverdue: 1, status: { [Op.lt]: TICKET_STATUS.RESOLVED } } }),
    Ticket.count({ where: { createTime: { [Op.gte]: todayStart } } }),
    Ticket.count({ where: { handleTime: { [Op.gte]: todayStart }, status: TICKET_STATUS.RESOLVED } })
  ])

  return {
    pendingReview: totalPending,
    reviewing: totalReviewing,
    resolved: totalResolved,
    rejected: totalRejected,
    overdue: totalOverdue,
    todayCreated,
    todayResolved,
    resolutionRate: totalResolved + totalRejected > 0
      ? Math.round((totalResolved / (totalResolved + totalRejected) * 100))
      : 0
  }
}

module.exports = {
  DISPUTE_TYPE,
  TICKET_STATUS,
  REVIEW_STEP,
  AFTER_SALE_VALID_DAYS,
  validateSubmitPrerequisites,
  validateSubmitData,
  checkDuplicateSubmit,
  submitAfterSale,
  processTicketStatus,
  validateProcessingResult,
  getFilteredTickets,
  batchOperation,
  getTicketTrace,
  getTicketStatistics
}
