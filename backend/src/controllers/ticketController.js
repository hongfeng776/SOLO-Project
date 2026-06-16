const { Op } = require('sequelize')
const { Ticket } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      status,
      priority,
      orderNo
    } = req.query

    const where = {}

    if (type !== undefined && type !== '') where.type = type
    if (status !== undefined && status !== '') where.status = status
    if (priority !== undefined && priority !== '') where.priority = priority
    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` }

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
    const ticket = await Ticket.findByPk(id)
    if (!ticket) throw new AppError('工单不存在', 404, 404)
    res.json(success(ticket))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    data.ticketNo = 'GD' + Date.now() + Math.floor(Math.random() * 1000)
    const ticket = await Ticket.create(data)
    res.json(success(ticket, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const ticket = await Ticket.findByPk(id)
    if (!ticket) throw new AppError('工单不存在', 404, 404)
    await ticket.update(data)
    res.json(success(ticket, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const handleTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { handlerId, handlerName, handleResult } = req.body

    const ticket = await Ticket.findByPk(id)
    if (!ticket) throw new AppError('工单不存在', 404, 404)
    if (ticket.status !== 1 && ticket.status !== 2) throw new AppError('工单状态不允许处理', 400, 400)

    await ticket.update({
      handlerId,
      handlerName,
      handleResult,
      handleTime: new Date(),
      status: 3
    })

    res.json(success(null, '处理成功'))
  } catch (error) {
    next(error)
  }
}

const closeTicket = async (req, res, next) => {
  try {
    const { id } = req.params

    const ticket = await Ticket.findByPk(id)
    if (!ticket) throw new AppError('工单不存在', 404, 404)
    if (ticket.status === 4) throw new AppError('工单已关闭', 400, 400)

    await ticket.update({ status: 4 })

    res.json(success(null, '关闭成功'))
  } catch (error) {
    next(error)
  }
}

const batchClose = async (req, res, next) => {
  try {
    const { ids } = req.body

    if (!ids || !ids.length) throw new AppError('请选择要关闭的工单', 400, 400)

    await Ticket.update(
      { status: 4 },
      { where: { id: { [Op.in]: ids }, status: { [Op.ne]: 4 } } }
    )

    res.json(success(null, '批量关闭成功'))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const typeStats = await Ticket.findAll({
      attributes: ['type', [Ticket.sequelize.fn('COUNT', '*'), 'count']],
      group: ['type']
    })

    const statusStats = await Ticket.findAll({
      attributes: ['status', [Ticket.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status']
    })

    const handledTickets = await Ticket.findAll({
      attributes: ['handleTime', 'createTime'],
      where: { status: { [Op.in]: [3, 4] }, handleTime: { [Op.ne]: null } }
    })

    let totalDuration = 0
    let durationCount = 0
    for (const t of handledTickets) {
      if (t.handleTime && t.createTime) {
        totalDuration += new Date(t.handleTime) - new Date(t.createTime)
        durationCount++
      }
    }

    const avgHandleDuration = durationCount > 0
      ? Math.round(totalDuration / durationCount / 1000 / 60)
      : 0

    res.json(success({
      typeStats: typeStats.map(s => ({ type: s.type, count: parseInt(s.dataValues.count) })),
      statusStats: statusStats.map(s => ({ status: s.status, count: parseInt(s.dataValues.count) })),
      avgHandleDuration
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
  handleTicket,
  closeTicket,
  batchClose,
  getStatistics
}
