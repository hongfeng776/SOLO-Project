const { Op } = require('sequelize')
const { FinanceStatement, FinanceSettlement, Driver } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getStatementList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      startTime,
      endTime,
      orderNo
    } = req.query

    const where = {}

    if (type !== undefined && type !== '') where.type = type
    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` }
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [startTime, endTime] }
    }

    const { count, rows } = await FinanceStatement.findAndCountAll({
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

const getSettlementList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      driverName,
      status
    } = req.query

    const where = {}

    if (driverName) where.driverName = { [Op.like]: `%${driverName}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await FinanceSettlement.findAndCountAll({
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

const getSettlementDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const settlement = await FinanceSettlement.findByPk(id)
    if (!settlement) throw new AppError('结算单不存在', 404, 404)
    res.json(success(settlement))
  } catch (error) {
    next(error)
  }
}

const createSettlement = async (req, res, next) => {
  try {
    const data = req.body
    data.settlementNo = 'JS' + Date.now() + Math.floor(Math.random() * 1000)
    const settlement = await FinanceSettlement.create(data)
    res.json(success(settlement, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const executeSettlement = async (req, res, next) => {
  try {
    const { id } = req.params
    const settlement = await FinanceSettlement.findByPk(id)
    if (!settlement) throw new AppError('结算单不存在', 404, 404)
    if (settlement.status !== 0) throw new AppError('只有待结算状态才能执行结算', 400, 400)

    await settlement.update({
      status: 1,
      settleTime: new Date()
    })

    res.json(success(null, '结算成功'))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const todayIncome = await FinanceStatement.sum('amount', {
      where: {
        type: 1,
        createTime: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }) || 0

    const totalIncome = await FinanceStatement.sum('amount', {
      where: { type: 1 }
    }) || 0

    const pendingSettlement = await FinanceSettlement.count({ where: { status: 0 } })

    res.json(success({
      todayIncome,
      totalIncome,
      pendingSettlement,
      monthIncome: todayIncome * 30
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getStatementList,
  getSettlementList,
  getSettlementDetail,
  createSettlement,
  executeSettlement,
  getStatistics
}
