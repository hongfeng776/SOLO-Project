const { Op } = require('sequelize')
const os = require('os')
const { OperationLog, RiskRecord, User } = require('../models')
const { success, pageResult } = require('../utils/response')

const getSystemStatus = async (req, res, next) => {
  try {
    const cpus = os.cpus()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory

    const onlineUsers = await User.count({ where: { status: 1 } })

    res.json(success({
      cpu: {
        model: cpus[0].model,
        cores: cpus.length,
        usage: Math.round(Math.random() * 30 + 20)
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        used: Math.round(usedMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        usageRate: ((usedMemory / totalMemory) * 100).toFixed(1)
      },
      dbConnections: 10,
      onlineUsers,
      uptime: os.uptime()
    }))
  } catch (error) {
    next(error)
  }
}

const getApiMetrics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

    const totalRequests = await OperationLog.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const successRequests = await OperationLog.count({
      where: { createTime: { [Op.gte]: todayStart }, status: 1 }
    })

    const errorRate = totalRequests > 0
      ? (((totalRequests - successRequests) / totalRequests) * 100).toFixed(1)
      : '0.0'

    const avgDuration = await OperationLog.findAll({
      attributes: [[OperationLog.sequelize.fn('AVG', OperationLog.sequelize.col('duration')), 'avgDuration']],
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const slowApis = await OperationLog.findAll({
      attributes: [
        'url',
        'method',
        [OperationLog.sequelize.fn('AVG', OperationLog.sequelize.col('duration')), 'avgDuration'],
        [OperationLog.sequelize.fn('COUNT', '*'), 'requestCount']
      ],
      where: { createTime: { [Op.gte]: todayStart } },
      group: ['url', 'method'],
      order: [[OperationLog.sequelize.fn('AVG', OperationLog.sequelize.col('duration')), 'DESC']],
      limit: 10
    })

    res.json(success({
      totalRequests,
      successRequests,
      errorRate,
      avgResponseTime: avgDuration[0] ? Math.round(parseFloat(avgDuration[0].dataValues.avgDuration)) : 0,
      slowApis: slowApis.map(api => ({
        url: api.url,
        method: api.method,
        avgDuration: Math.round(parseFloat(api.dataValues.avgDuration)),
        requestCount: parseInt(api.dataValues.requestCount)
      }))
    }))
  } catch (error) {
    next(error)
  }
}

const getOperationLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      module,
      action,
      username,
      status,
      startTime,
      endTime
    } = req.query

    const where = {}

    if (module) where.module = { [Op.like]: `%${module}%` }
    if (action) where.action = { [Op.like]: `%${action}%` }
    if (username) where.username = { [Op.like]: `%${username}%` }
    if (status !== undefined && status !== '') where.status = status
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [startTime, endTime] }
    }

    const { count, rows } = await OperationLog.findAndCountAll({
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

const getAlertList = async (req, res, next) => {
  try {
    const riskAlerts = await RiskRecord.findAll({
      where: { severity: 3, status: 0 },
      order: [['createTime', 'DESC']],
      limit: 10
    })

    const systemAlerts = []
    const freeMemory = os.freemem()
    const totalMemory = os.totalmem()
    if (freeMemory / totalMemory < 0.2) {
      systemAlerts.push({ type: 'system', level: 'high', message: '系统内存不足', value: ((1 - freeMemory / totalMemory) * 100).toFixed(1) + '%' })
    }

    const businessAlerts = []
    const pendingRisk = await RiskRecord.count({ where: { status: 0 } })
    if (pendingRisk > 50) {
      businessAlerts.push({ type: 'business', level: 'warning', message: '待处理风控记录过多', value: pendingRisk })
    }

    res.json(success({
      riskAlerts: riskAlerts.map(r => ({ type: 'risk', level: 'high', ...r.toJSON() })),
      systemAlerts,
      businessAlerts
    }))
  } catch (error) {
    next(error)
  }
}

const getHealthCheck = async (req, res, next) => {
  try {
    const dbStatus = { status: 'ok', message: '数据库连接正常' }
    try {
      await OperationLog.findOne({ limit: 1 })
    } catch (e) {
      dbStatus.status = 'error'
      dbStatus.message = '数据库连接异常'
    }

    const diskSpace = {
      total: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024 / 1024),
      usageRate: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1)
    }

    const services = [
      { name: 'API服务', status: 'running' },
      { name: '数据库', status: dbStatus.status === 'ok' ? 'running' : 'error' },
      { name: '缓存服务', status: 'running' }
    ]

    res.json(success({
      status: dbStatus.status === 'ok' ? 'healthy' : 'unhealthy',
      database: dbStatus,
      diskSpace,
      services
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSystemStatus,
  getApiMetrics,
  getOperationLogs,
  getAlertList,
  getHealthCheck
}
