const OperationLog = require('../models/OperationLog')

const MODULE_MAP = {
  order: '订单管理',
  driver: '司机管理',
  vehicle: '车辆管理',
  passenger: '乘客管理',
  capacity: '运力管理',
  finance: '财务管理',
  system: '系统管理',
  dashboard: '仪表盘',
  risk: '风控管理',
  ticket: '工单管理',
  coupon: '优惠券管理',
  marketing: '营销管理',
  notification: '通知管理',
  analytics: '数据分析',
  monitor: '系统监控'
}

const ACTION_MAP = {
  POST: '创建',
  PUT: '更新',
  DELETE: '删除',
  PATCH: '修改'
}

function parseModule(url) {
  const path = url.split('?')[0]
  const segments = path.split('/').filter(Boolean)
  const moduleName = segments[0]
  return MODULE_MAP[moduleName] || moduleName
}

function parseAction(method, url) {
  const path = url.split('?')[0]
  const segments = path.split('/').filter(Boolean)
  const moduleName = MODULE_MAP[segments[0]] || segments[0]
  const actionPrefix = ACTION_MAP[method]
  if (!actionPrefix) return `${method} ${path}`

  if (segments.length >= 3 && segments[2] === 'dispatch') return `派单`
  if (segments.length >= 3 && segments[2] === 'cancel') return `取消`
  if (segments.length >= 3 && segments[2] === 'status') return `更新状态`
  return `${actionPrefix}${moduleName}`
}

function filterSensitiveParams(params) {
  if (!params || typeof params !== 'object') return params
  const filtered = { ...params }
  for (const key of Object.keys(filtered)) {
    if (key.toLowerCase().includes('password')) {
      filtered[key] = '******'
    }
  }
  return filtered
}

const operationLogger = (req, res, next) => {
  req._startTime = Date.now()

  if (req.method === 'GET') return next()

  res.on('finish', () => {
    const duration = Date.now() - req._startTime

    OperationLog.create({
      userId: req.user?.id || 0,
      username: req.user?.username || 'unknown',
      nickname: req.user?.nickname || 'unknown',
      module: parseModule(req.originalUrl),
      action: parseAction(req.method, req.originalUrl),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      params: JSON.stringify(filterSensitiveParams(req.body)),
      status: res.statusCode < 400 ? 1 : 0,
      duration
    }).catch(err => {
      console.error('操作日志记录失败:', err.message)
    })
  })

  next()
}

module.exports = { operationLogger }
