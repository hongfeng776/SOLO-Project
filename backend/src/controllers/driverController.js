const { Op } = require('sequelize')
const { Driver } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const driverAuditService = require('../services/driverAuditService')

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      status,
      auditStatus,
      city,
      vehicleType,
      reputationLevel,
      qualificationStatus,
      isUrgent,
      driverLevel
    } = req.query

    const where = {}

    if (name) where.name = { [Op.like]: `%${name}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (status !== undefined && status !== '') where.status = status
    if (auditStatus !== undefined && auditStatus !== '') where.auditStatus = auditStatus
    if (city) where.city = city
    if (vehicleType) where.vehicleType = vehicleType
    if (reputationLevel !== undefined && reputationLevel !== '') where.reputationLevel = reputationLevel
    if (qualificationStatus !== undefined && qualificationStatus !== '') where.qualificationStatus = qualificationStatus
    if (isUrgent !== undefined && isUrgent !== '') where.isUrgent = isUrgent
    if (driverLevel !== undefined && driverLevel !== '') where.driverLevel = driverLevel

    const order = []
    if (isUrgent === '1') {
      order.push(['isUrgent', 'DESC'])
    }
    order.push(['createTime', 'DESC'])

    const { count, rows } = await Driver.findAndCountAll({
      where,
      order,
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
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const strictness = driverAuditService.getAuditStrictness(driver)

    res.json(success({
      ...driver.toJSON(),
      auditStrictness: strictness
    }))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const driver = await Driver.create(data)

    await driverAuditService.createAuditLog(driver.id, 1, {
      remark: '司机提交入驻资料'
    })

    res.json(success(driver, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    await driver.update(data)

    await driverAuditService.createAuditLog(id, 2, {
      remark: '司机修改入驻资料',
      qualificationCheck: data
    })

    res.json(success(driver, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ status })
    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const checkQualification = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await driverAuditService.checkQualification(id)
    res.json(success(result, '资质校验完成'))
  } catch (error) {
    next(error)
  }
}

const getAuditStrictness = async (req, res, next) => {
  try {
    const { id } = req.params
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    const strictness = driverAuditService.getAuditStrictness(driver)
    res.json(success(strictness))
  } catch (error) {
    next(error)
  }
}

const audit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { auditStatus, remark } = req.body
    const { userId, userName } = req.user || {}

    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)

    const oldStatus = driver.auditStatus

    await driver.update({
      auditStatus,
      auditRemark: remark,
      auditTime: new Date(),
      auditorId: userId
    })

    if (auditStatus === 1) {
      await driverAuditService.updateCanAcceptOrder(id, true)
    } else if (auditStatus === 2) {
      await driverAuditService.updateCanAcceptOrder(id, false)
    }

    await driverAuditService.createAuditLog(id, auditStatus === 1 ? 3 : 4, {
      oldStatus,
      newStatus: auditStatus,
      remark,
      operatorId: userId,
      operatorName: userName
    })

    await driverAuditService.sendAuditNotification(driver, auditStatus, remark)

    res.json(success(null, '审核成功'))
  } catch (error) {
    next(error)
  }
}

const batchAudit = async (req, res, next) => {
  try {
    const { ids, auditStatus, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchAudit(ids, auditStatus, remark, userId, userName)

    res.json(success(results, '批量操作完成'))
  } catch (error) {
    next(error)
  }
}

const batchReview = async (req, res, next) => {
  try {
    const { ids, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchReview(ids, remark, userId, userName)

    res.json(success(results, '批量复核完成'))
  } catch (error) {
    next(error)
  }
}

const batchRemind = async (req, res, next) => {
  try {
    const { ids, remark } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchRemind(ids, remark, userId, userName)

    res.json(success(results, '批量提醒完成'))
  } catch (error) {
    next(error)
  }
}

const batchUrgent = async (req, res, next) => {
  try {
    const { ids } = req.body
    const { userId, userName } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400, 400)
    }

    const results = await driverAuditService.batchUrgent(ids, userId, userName)

    res.json(success(results, '批量加急完成'))
  } catch (error) {
    next(error)
  }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const logs = await driverAuditService.getAuditLogs(id)
    res.json(success(logs))
  } catch (error) {
    next(error)
  }
}

const getAuditDashboard = async (req, res, next) => {
  try {
    const dashboard = await driverAuditService.getAuditDashboard()
    res.json(success(dashboard))
  } catch (error) {
    next(error)
  }
}

const updateUploadProgress = async (req, res, next) => {
  try {
    const { id } = req.params
    const { progress } = req.body
    const driver = await Driver.findByPk(id)
    if (!driver) throw new AppError('司机不存在', 404, 404)
    await driver.update({ uploadProgress: progress })
    res.json(success({ progress }, '进度更新成功'))
  } catch (error) {
    next(error)
  }
}

const checkExpiredQualifications = async (req, res, next) => {
  try {
    const results = await driverAuditService.checkExpiredQualifications()
    res.json(success(results, `检测到${results.length}个过期资质`))
  } catch (error) {
    next(error)
  }
}

const getPendingAuditCount = async (req, res, next) => {
  try {
    const count = await Driver.count({ where: { auditStatus: 0 } })
    res.json(success(count))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteDriver,
  updateStatus,
  checkQualification,
  getAuditStrictness,
  audit,
  batchAudit,
  batchReview,
  batchRemind,
  batchUrgent,
  getAuditLogs,
  getAuditDashboard,
  updateUploadProgress,
  checkExpiredQualifications,
  getPendingAuditCount
}
